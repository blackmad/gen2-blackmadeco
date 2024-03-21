import paper from "paper";
import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  flattenArrayOfPathItems,
  makeIncrementalPath,
} from "../../utils/paperjs-utils";
import { makeLeftBuckle, makeRightBuckle } from "./buckle-helpers";

// TOOD
// one buckle, left side
// one buckle, right side

// mulitple buckle, left side
// mulitple buckle, right side

// post style closure

// corset style closure

// different cuvrve / deeper neck

type ModelParameters = Record<string, number | string>;

function makeCollarCurve({
  maxHeight,
  minHeight,
  neckSize,
}: {
  maxHeight: number;
  minHeight: number;
  neckSize: number;
}) {
  const initialRise = (maxHeight - minHeight) * 0.25;
  const flatRunOnBottom = 1;
  const dropBelowBuckles = 0.5;

  const topStart = new paper.Point(0, 0);
  const distanceToVeryTop = 2;
  const top = makeIncrementalPath(topStart, [
    [distanceToVeryTop, -initialRise],
    // Now dive down to the middle
    [neckSize / 2 - distanceToVeryTop, initialRise * 2 + dropBelowBuckles],
    // mirror
    [neckSize / 2 - distanceToVeryTop, -initialRise * 2 - dropBelowBuckles],
    // mirror
    [distanceToVeryTop, initialRise],
  ]);
  top.smooth({ type: "continuous" });

  const bottomStart = new paper.Point(0, minHeight);

  const bottom = makeIncrementalPath(bottomStart, [
    [flatRunOnBottom, 0.1],
    // Go the rest of the way to the initial rise
    [neckSize / 2 - flatRunOnBottom, maxHeight + dropBelowBuckles - minHeight],
    [neckSize / 2 - flatRunOnBottom, -maxHeight - dropBelowBuckles + minHeight],
    [flatRunOnBottom, -0.1],
  ]);
  bottom.smooth({ type: "catmull-rom" });

  const outerModel = top;
  // top.lineTo(bottomEnd);
  bottom.reverse();
  top.addSegments(bottom.segments);
  // top.lineTo(topStart);
  top.closePath();

  return outerModel;
}

export class PostureCollarOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Max Height",
        min: 1,
        max: 5,
        value: 3.5,
        step: 0.25,
        name: "maxHeight",
      }),
      new RangeMetaParameter({
        title: "Min Height",
        min: 1,
        max: 5,
        value: 2.5,
        step: 0.25,
        name: "minHeight",
      }),
      new RangeMetaParameter({
        title: "Buckle Height",
        min: 1,
        max: 5,
        value: 2,
        step: 0.25,
        name: "buckleHeight",
      }),
      new RangeMetaParameter({
        title: "Neck Size",
        min: 8,
        max: 18,
        value: 13,
        step: 0.1,
        name: "neckSize",
      }),
    ];
  }

  public controlInfo =
    "Measure your neck with a sewing tape measure.<br/>If you don't have one handy, 13.5 inches is usually a good size for a cis woman, and 15 inches for a cis man. Don't worry, this pattern generates extra length.<br/>Note that a straight collar taller than about 2 inches will not be very comfortable.";
  constructor(public subModel: any) {
    super();
  }

  public async make(
    paper: paper.PaperScope,
    options: ModelParameters
  ): Promise<CompletedModel> {
    const params = options[this.constructor.name];
    const { buckleHeight, maxHeight, minHeight } = params;

    // const startOfCollarTop = new Point(0, 0);
    // const fullBuckleRectangle = new Rectangle(startOfCollarTop, new Point(totalLength, minHeight));
    // const fullBuckleRectanglePath = new Path.Rectangle(fullBuckleRectangle);

    // start and end
    // const initialCurveHeight = initialRise + minHeight

    // const startOfLeftCurveTop = new paper.Point(initialBuckleLength, -initialRise)
    // const leftStart = new Path.Line(startOfLeftCurveTop, new paper.Point(initialBuckleLength,  minimumPostureSize));
    // const endOfRightCurveTop = new paper.Point(initialBuckleLength + widthOfCollarPortion, -initialRise)
    // const rightEnd = new Path.Line(endOfRightCurveTop, new paper.Point(initialBuckleLength + widthOfCollarPortion,  minimumPostureSize));

    // const middleTop = new paper.Point(initialBuckleLength + widthOfCollarPortion/2, dropBelowBuckles)
    // const middleLine = new Path.Line(middleTop, new paper.Point(initialBuckleLength + widthOfCollarPortion/2,  dropBelowBuckles + maxHeight));

    // const topCurveLeft = new Curve(startOfLeftCurveTop, startOfLeftCurveTop, middleTop, middleTop)

    const mainCollarCurve = makeCollarCurve(params);

    const { buckle: leftBuckle, holes: leftHoles } = makeLeftBuckle({
      paper,
      height: buckleHeight,
    });
    const { buckle: rightBuckle, holes: rightHoles } = makeRightBuckle({
      paper,
      height: buckleHeight,
    });

    new paper.Group([leftBuckle, ...leftHoles]).translate(
      new paper.Point(-leftBuckle.bounds.width, (minHeight - buckleHeight) / 2)
    );
    new paper.Group([rightBuckle, ...rightHoles]).translate(
      new paper.Point(
        mainCollarCurve.bounds.width,
        (minHeight - buckleHeight) / 2
      )
    );
    addToDebugLayer(paper, "leftBuckle", leftBuckle.clone());
    addToDebugLayer(paper, "rightBuckle", rightBuckle.clone());

    const outerModel = mainCollarCurve;

    // addToDebugLayer(paper, "outerModel", outerModel);
    const safeArea = PaperOffset.offset(outerModel.clone(), -0.25, {
      jointType: "jtMiter",
      endType: "etClosedPolygon",
      miterLimit: 2.0,
      roundPrecision: 0.25,
    });

    const innerOptions = options[this.subModel.constructor.name] || {};

    // TODO: wtf is safecone
    innerOptions.safeCone = outerModel.clone();
    innerOptions.outerModel = outerModel.clone();

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const finalOuterModel = outerModel.unite(leftBuckle).unite(rightBuckle);
    finalOuterModel.closePath();
    addToDebugLayer(paper, "pre-finalOuterModel", finalOuterModel.clone());
    const outerPaths = flattenArrayOfPathItems(paper, [finalOuterModel]);

    const newOuterPaths = [];
    outerPaths.forEach((p) => {
      const diamonds: paper.Path[] = [];
      // First step, put a diamond at every 90 degree angle
      p.segments.forEach((segment, segmentIndex) => {
        const point1 = segment.previous.point.subtract(segment.point);
        const point2 = segment.next.point.subtract(segment.point);
        const angle = Math.round(point1.getDirectedAngle(point2));
        console.log(
          `angle: ${angle} from ${segment.point} ${point1} to ${point2} - is 90? ${Math.abs(angle) % 90}`
        );
        if (
          Math.abs(angle) % 90 !== 0 ||
          Math.abs(angle) % 180 == 0 ||
          segment.isSmooth()
        ) {
          return;
        }

        console.log("making a diamond here");

        const shortestSide = Math.min(
          Math.min(
            ...[
              segment.previous.point.getDistance(segment.point),
              segment.next.point.getDistance(segment.point),
            ]
          ),
          0.25
        );

        const top = segment.point.add([0, -shortestSide]);
        const bottom = segment.point.add([0, shortestSide]);
        const left = segment.point.add([-shortestSide, 0]);
        const right = segment.point.add([shortestSide, 0]);
        // Build path.
        const diamond1 = new paper.Path({
          segments: [top, right, bottom, left, top],
        });

        addToDebugLayer(paper, "diamond", diamond1);

        const diamond2 = new paper.Path.Star({
          center: segment.point,
          points: 2,
          radius1: shortestSide / 2,
          radius2: shortestSide * 2,
        });
        addToDebugLayer(paper, "diamond2", diamond2);

        diamonds.push(diamond1);
        diamonds.push(diamond2);
      });

      // Next step, union in all the diamonds
      let newP = p;
      diamonds.forEach((d) => {
        newP = newP.unite(d);
      });

      newP.segments.forEach((segment, segmentIndex) => {
        const point1 = segment.previous.point.subtract(segment.point);
        const point2 = segment.next.point.subtract(segment.point);
        const angle = point1.getDirectedAngle(point2);

        if (
          Math.abs(angle) % 90 === 0 ||
          segment.isSmooth() ||
          // This is an awful hack! omg!
          segment.point.x < -2 ||
          segment.point.x > mainCollarCurve.bounds.width + 1
        ) {
          return;
        }

        segment.smooth();
        console.log("smoothing segment");
      });

      newOuterPaths.push(newP);
    });

    return new CompletedModel({
      outer: newOuterPaths[0],
      holes: [...leftHoles, ...rightHoles],
      // holes: allHoles,
      design: innerDesign.paths,
      // design: [],
    });
  }
}
