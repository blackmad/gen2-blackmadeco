import { PaperOffset } from "paperjs-offset";

import {
  MetaParameter,
  OnOffMetaParameter,
  RangeMetaParameter,
} from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  clampPathsToBoundary,
  flattenArrayOfPathItems,
  makeIncrementalPath,
  makeSyntheticBoundaryModel,
} from "../../utils/paperjs-utils";
import { roundCorners } from "../../utils/round-corners";
import { makeLeftBuckle, makeRightBuckle } from "./buckle-helpers";

type ModelParameters = Record<string, number | string>;

function makeCollarCurve(
  paper: paper.PaperScope,
  {
    maxHeight,
    minHeight,
    neckSize: originalNeckSize,
    neckDrop,
    flatRunOnBottomPercentage,
    distanceToVeryTopPercentage,
  }: {
    maxHeight: number;
    minHeight: number;
    neckSize: number;
    neckDrop: number;
    flatRunOnBottomPercentage: number;
    distanceToVeryTopPercentage: number;
  }
) {
  const neckSize = originalNeckSize - 3;
  const initialRise = (maxHeight - minHeight) * 0.25;
  const flatRunOnBottom = neckSize * (flatRunOnBottomPercentage / 100);
  console.log({ flatRunOnBottom });
  const dropBelowBuckles = neckDrop;

  const topStart = new paper.Point(0, 0);
  const distanceToVeryTop = (distanceToVeryTopPercentage / 100) * neckSize;
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

export class CorsetBeltOuter extends OuterPaperModelMaker {
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
        value: 0.75,
        step: 0.25,
        name: "buckleHeight",
      }),
      new RangeMetaParameter({
        title: "Num Buckles",
        min: 1,
        max: 5,
        value: 2,
        step: 1,
        name: "numBuckles",
      }),
      new RangeMetaParameter({
        title: "Num Holes",
        min: 1,
        max: 20,
        value: 6,
        step: 1,
        name: "numHoles",
      }),
      new RangeMetaParameter({
        title: "Neck Size",
        min: 8,
        max: 100,
        value: 38,
        step: 0.1,
        name: "neckSize",
      }),
      new RangeMetaParameter({
        title: "neckDrop",
        min: 0,
        max: 10,
        value: 0.5,
        step: 0.1,
        name: "neckDrop",
      }),
      new OnOffMetaParameter({
        title: "Smooth Corners",
        value: true,
        name: "smoothCorners",
      }),
      new RangeMetaParameter({
        title: "Bottom Ring Attachment Length (zero for none)",
        min: 0,
        max: 10,
        value: 0,
        step: 0.1,
        name: "bottomRingLength",
      }),
      new RangeMetaParameter({
        title: "Middle Reserved Space (inches, zero for none)",
        min: 0,
        max: 10,
        value: 0,
        step: 0.1,
        name: "middleSeparation",
      }),
      new RangeMetaParameter({
        title: "flatRunOnBottomPercentage",
        min: 0,
        max: 100,
        value: 40,
        step: 0.1,
        name: "flatRunOnBottomPercentage",
      }),
      new RangeMetaParameter({
        title: "distanceToVeryTopPercentage",
        min: 0,
        max: 100,
        value: 400 / 13,
        step: 0.1,
        name: "distanceToVeryTopPercentage",
      }),
    ];
  }

  public controlInfo =
    "Measure your neck with a sewing tape measure.<br/>If you don't have one handy, 13.5 inches is usually a good size for a cis woman, and 15 inches for a cis man. Don't worry, this pattern generates extra length.<br/>Note that a straight collar taller than about 2 inches will not be very comfortable.";
  constructor(public subModel: any) {
    super();
  }

  private makeFinalCollarOutline({
    paper,
    buckleHeight,
    minHeight,
    mainCollarCurve,
    numBuckles,
    numHoles,
    bottomRingLength,
  }: {
    paper: paper.PaperScope;
    numHoles: number;
    numBuckles: number;
    buckleHeight: number;
    minHeight: number;
    mainCollarCurve: paper.Path;
  }) {
    let modelInProgress: paper.PathItem = mainCollarCurve;

    let allHoles: paper.Path[] = [];

    console.log(`
    buckleHeight: ${buckleHeight}
    minHeight: ${minHeight}
    extraSpace = ${minHeight - buckleHeight * numBuckles}
    `);
    const buckleSpacing =
      (minHeight - buckleHeight * numBuckles) / (numBuckles + 1);

    for (let i = 0; i < numBuckles; i++) {
      const { buckle: leftBuckle, holes: leftHoles } = makeLeftBuckle({
        paper,
        height: buckleHeight,
      });
      const { buckle: rightBuckle, holes: rightHoles } = makeRightBuckle({
        paper,
        height: buckleHeight,
        numHoles,
      });

      new paper.Group([leftBuckle, ...leftHoles]).translate(
        new paper.Point(
          -leftBuckle.bounds.width,
          buckleSpacing * (i + 1) + buckleHeight * i
        )
      );
      new paper.Group([rightBuckle, ...rightHoles]).translate(
        new paper.Point(
          mainCollarCurve.bounds.width,
          buckleSpacing * (i + 1) + buckleHeight * i
        )
      );
      addToDebugLayer(paper, "leftBuckle", leftBuckle.clone());
      addToDebugLayer(paper, "rightBuckle", rightBuckle.clone());

      modelInProgress = modelInProgress.unite(leftBuckle).unite(rightBuckle);

      allHoles = [...allHoles, ...leftHoles, ...rightHoles];
    }

    return {
      model: modelInProgress,
      holes: allHoles,
    };
  }

  public async make(
    paper: paper.PaperScope,
    options: ModelParameters
  ): Promise<CompletedModel> {
    const params = options[this.constructor.name];
    const {
      buckleHeight,
      maxHeight,
      minHeight,
      numBuckles,
      smoothCorners,
      numHoles,
      bottomRingLength,
      middleSeparation,
    } = params;

    console.log({ params });

    if (buckleHeight * numBuckles > minHeight) {
      throw new Error(
        `The total height of the buckles is greater than the minimum height. Please reduce the number of buckles or the height of each buckle.`
      );
    }

    const mainCollarCurve = makeCollarCurve(paper, params);

    let outerModel = mainCollarCurve;

    if (middleSeparation > 0) {
      const middleSpace = new paper.Path.Rectangle(
        mainCollarCurve.bounds.topCenter.subtract(middleSeparation / 2, 0),
        new paper.Size(
          mainCollarCurve.bounds.width,
          mainCollarCurve.bounds.height
        )
      );
      outerModel = flattenArrayOfPathItems(
        paper,
        outerModel.subtract(middleSpace)
      )[0];
    }

    const innerOptions = options[this.subModel.constructor.name] || {};

    // TODO: wtf is safecone

    const patternPercentage = 0.66;
    innerOptions.safeCone = new paper.Path.Rectangle(
      [
        outerModel.bounds.topLeft.x +
          (outerModel.bounds.width * (1 - patternPercentage)) / 2,
        outerModel.bounds.topLeft.y,
      ],
      [outerModel.bounds.width * patternPercentage, outerModel.bounds.height]
    );

    innerOptions.outerModel = makeSyntheticBoundaryModel(paper, outerModel);

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const slightlySmallerOuterModelBounds = mainCollarCurve.bounds
      .clone()
      .expand([-2, 0]);

    const slightlySmallerOuterModel = mainCollarCurve.intersect(
      new paper.Path.Rectangle(slightlySmallerOuterModelBounds)
    );
    addToDebugLayer(
      paper,
      "slightlySmallerOuterModelBounds",
      slightlySmallerOuterModelBounds
    );

    addToDebugLayer(
      paper,
      "slightlySmallerOuterModel",
      slightlySmallerOuterModel
    );

    const newSafeBoundaryModel = PaperOffset.offset(
      slightlySmallerOuterModel,
      -innerOptions.safeBorderWidth,
      {
        jointType: "jtMiter",
        endType: "etClosedPolygon",
        miterLimit: 2.0,
        roundPrecision: 0.25,
      }
    );

    if (middleSeparation > 0) {
      const pathGroup = new paper.Group(
        innerDesign.paths.map((p) => p.clone())
      );
      pathGroup.translate([
        mainCollarCurve.bounds.width / 2 + middleSeparation / 2,
        0,
      ]);
      pathGroup.scale(-1, 1);
      addToDebugLayer(paper, "middleSpace", pathGroup);
      innerDesign.paths = [...innerDesign.paths, ...pathGroup.children];
    }

    innerDesign.paths = clampPathsToBoundary(
      innerDesign.paths,
      newSafeBoundaryModel,
      "tripleClamped"
    );

    const { model: finalOuterModel, holes } = this.makeFinalCollarOutline({
      paper,
      buckleHeight,
      minHeight,
      mainCollarCurve,
      numBuckles,
      numHoles,
    });

    // This is all absolutely absurd 90 degree corner smoothing logic
    addToDebugLayer(paper, "pre-finalOuterModel", finalOuterModel.clone());
    const outerPaths = flattenArrayOfPathItems(paper, [finalOuterModel]);

    let finalOuter = smoothCorners
      ? tryToSmoothRightAngles({
          outerPaths,
          paper,
          mainCollarCurve,
        })
      : outerPaths[0];

    // Lastly, stick a ring attachment point the bottom if needed
    // We do this last because otherwise the smoothing logic will mess it up
    if (bottomRingLength > 0) {
      const bottomRingHeight = 0.75;
      const bottomRing = new paper.Path.Rectangle(
        new paper.Rectangle(
          mainCollarCurve.bounds.bottomCenter,
          new paper.Size(bottomRingLength, bottomRingHeight)
        )
      );
      bottomRing.translate([-bottomRingLength / 2, -bottomRingHeight / 2]);
      finalOuter = finalOuter.unite(bottomRing);
    }

    return new CompletedModel({
      outer: finalOuter,
      holes,
      design: innerDesign.paths,
      // design: [],
    });
  }
}

function tryToSmoothRightAngles({
  paper,
  outerPaths,
  mainCollarCurve,
}: {
  outerPaths: paper.Path[];
  paper: paper.PaperScope;
  mainCollarCurve: paper.Path;
}): paper.Path {
  addToDebugLayer(paper, "outerPaths", new paper.Group(outerPaths));
  const rounded = roundCorners({
    paper,
    path: mainCollarCurve,
    radius: 0.5,
  });
  addToDebugLayer(paper, "rounded", rounded);

  console.groupCollapsed("tryToSmoothRightAngles");
  const newOuterPaths: paper.Path[] = [];

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
        ...[
          segment.previous.point.getDistance(segment.point),
          segment.next.point.getDistance(segment.point),
        ]
      );

      const top = segment.point.add([0, -shortestSide]);
      const bottom = segment.point.add([0, shortestSide]);
      const left = segment.point.add([-shortestSide, 0]);
      const right = segment.point.add([shortestSide, 0]);
      // Build path.
      const diamond1 = new paper.Path({
        segments: [top, right, bottom, left, top],
      });
      diamond1.closePath();

      const comingFromRight = point1.y <= point2.y;

      // const diamond11 = diamond1.clone();
      // diamonds.push(diamond11);
      // addToDebugLayer(paper,  "diamond", diamond11);
      addToDebugLayer(paper, "diamond", diamond1);

      const diamond2 = new paper.Path.Star({
        center: segment.point,
        points: 2,
        radius1: shortestSide / 2,
        radius2: shortestSide * 2,
      });
      // diamond2.translate([
      //   shortestSide * 0.1 * (comingFromRight ? 1 : -1),
      //   0,
      // ]);
      addToDebugLayer(paper, "diamond2", diamond2);

      diamonds.push(diamond1);
      diamonds.push(diamond2);
    });

    // Next step, union in all the diamonds
    const newP = p;
    // diamonds.forEach((d) => {
    //   newP = newP.unite(d);
    //   newP.closePath();
    // });

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
  return newOuterPaths[0];
}
