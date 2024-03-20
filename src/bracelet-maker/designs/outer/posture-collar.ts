import paper from "paper";
import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { makeIncrementalPath } from "../../utils/paperjs-utils";

type ModelParameters = Record<string, number | string>;

function makeCollarCurve({
  collarHeight,
  buckleHeight,
  neckSize,
}: {
  collarHeight: number;
  buckleHeight: number;
  neckSize: number;
}) {
  const initialRise = (collarHeight - buckleHeight) * 0.25;
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

  const bottomStart = new paper.Point(0, buckleHeight);

  const bottom = makeIncrementalPath(bottomStart, [
    [flatRunOnBottom, 0.1],
    // Go the rest of the way to the initial rise
    [
      neckSize / 2 - flatRunOnBottom,
      collarHeight + dropBelowBuckles - buckleHeight,
    ],
    [
      neckSize / 2 - flatRunOnBottom,
      -collarHeight - dropBelowBuckles + buckleHeight,
    ],
    [flatRunOnBottom, -0.1],
  ]);
  bottom.smooth({ type: "catmull-rom" });

  const topEnd = top.lastSegment.point;
  const bottomEnd = bottom.lastSegment.point;
  console.log({ topEnd });

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
        title: "Height",
        min: 1,
        max: 5,
        value: 3.5,
        step: 0.25,
        name: "collarHeight",
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

    // const startOfCollarTop = new Point(0, 0);
    // const fullBuckleRectangle = new Rectangle(startOfCollarTop, new Point(totalLength, buckleHeight));
    // const fullBuckleRectanglePath = new Path.Rectangle(fullBuckleRectangle);

    // start and end
    // const initialCurveHeight = initialRise + buckleHeight

    // const startOfLeftCurveTop = new paper.Point(initialBuckleLength, -initialRise)
    // const leftStart = new Path.Line(startOfLeftCurveTop, new paper.Point(initialBuckleLength,  minimumPostureSize));
    // const endOfRightCurveTop = new paper.Point(initialBuckleLength + widthOfCollarPortion, -initialRise)
    // const rightEnd = new Path.Line(endOfRightCurveTop, new paper.Point(initialBuckleLength + widthOfCollarPortion,  minimumPostureSize));

    // const middleTop = new paper.Point(initialBuckleLength + widthOfCollarPortion/2, dropBelowBuckles)
    // const middleLine = new Path.Line(middleTop, new paper.Point(initialBuckleLength + widthOfCollarPortion/2,  dropBelowBuckles + collarHeight));

    // const topCurveLeft = new Curve(startOfLeftCurveTop, startOfLeftCurveTop, middleTop, middleTop)

    const mainCollarCurve = makeCollarCurve(params);
    const outerModel = mainCollarCurve;

    // addToDebugLayer(paper, "outerModel", outerModel);
    const safeArea = PaperOffset.offset(outerModel.clone(), -0.25, {
      jointType: "jtMiter",
      endType: "etClosedPolygon",
      miterLimit: 2.0,
      roundPrecision: 0.25,
    });

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.height = outerModel.bounds.height + 5;
    innerOptions.width = outerModel.bounds.width;
    innerOptions.boundaryModel = outerModel.clone(); // safeArea.clone();

    // TODO: wtf is safecone
    innerOptions.safeCone = outerModel.clone();
    innerOptions.outerModel = outerModel.clone();

    // console.log({ outerModel });

    const innerDesign = await this.subModel.make(paper, innerOptions);

    return new CompletedModel({
      outer: outerModel,
      holes: [],
      // holes: allHoles,
      design: innerDesign.paths,
      // design: [],
    });
  }
}
