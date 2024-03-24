import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import { roundCorners } from "../../utils/round-corners";
import { makeLeftBuckle, makeRightBuckle } from "./buckle-helpers";

type ModelParameters = Record<string, number | string>;

function makeFinalCollarOutline({
  paper,
  buckleHeight,
  height,
  numBuckles,
  numHoles,
  neckSize: originalNeckSize,
}: {
  paper: paper.PaperScope;
  numHoles: number;
  numBuckles: number;
  buckleHeight: number;
  height: number;
  neckSize: number;
}) {
  const neckSize = originalNeckSize - 3;

  let modelInProgress: paper.PathItem = new paper.Path.Rectangle(
    new paper.Rectangle(0, 0, neckSize, height)
  );

  // Left Diamond
  const leftDiamond = new paper.Path([
    [0, 0],
    [0, height],
    [-0.5, height / 2],
    [0, 0],
  ]);

  const rightDiamond = new paper.Path([
    [neckSize, 0],
    [neckSize, height],
    [neckSize + 0.5, height / 2],
    [neckSize, 0],
  ]);

  modelInProgress = modelInProgress.unite(leftDiamond);
  modelInProgress = modelInProgress.unite(rightDiamond);
  const safeArea = modelInProgress.clone();

  addToDebugLayer(paper, "diamonds", leftDiamond);

  let allHoles: paper.Path[] = [];

  console.log(`
  buckleHeight: ${buckleHeight}
  minHeight: ${height}
  extraSpace = ${height - buckleHeight * numBuckles}
  `);
  const buckleSpacing = (height - buckleHeight * numBuckles) / (numBuckles + 1);

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
      new paper.Point(neckSize, buckleSpacing * (i + 1) + buckleHeight * i)
    );
    addToDebugLayer(paper, "leftBuckle", leftBuckle.clone());
    addToDebugLayer(paper, "rightBuckle", rightBuckle.clone());

    modelInProgress = modelInProgress.unite(leftBuckle).unite(rightBuckle);

    allHoles = [...allHoles, ...leftHoles, ...rightHoles];
  }

  return {
    model: modelInProgress,
    holes: allHoles,
    safeArea,
  };
}

export class StraightCollarOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "buckle Height",
        min: 1,
        max: 5,
        value: 1,
        step: 0.25,
        name: "buckleHeight",
      }),
      new RangeMetaParameter({
        title: "Height",
        min: 1,
        max: 5,
        value: 2,
        step: 0.25,
        name: "height",
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
    const { height, neckSize, buckleHeight } = options[this.constructor.name];

    const safeAreaPadding = 0.5;
    const safeAreaLength = neckSize;

    // Buckle holes
    const {
      model: outerModel,
      holes,
      safeArea,
    } = makeFinalCollarOutline({
      paper,
      buckleHeight,
      height,
      numBuckles: 1,
      neckSize,
      numHoles: 6,
    });

    let roundedOuterModel = roundCorners({
      paper,
      path: outerModel,
      radius: 0.5,
    });

    // const safeArea = new paper.Path.Rectangle(
    //   new paper.Rectangle(
    //     buckleHoleBounds.width + safeAreaPadding,
    //     0,
    //     safeAreaLength,
    //     height
    //   )
    // );

    // safeArea.strokeColor = new paper.Color("green");
    // safeArea.strokeWidth = 0.001;
    // // safeArea.remove();

    // const safeCone = new paper.Path.Rectangle(
    //   new paper.Rectangle(
    //     buckleHoleBounds.width + safeAreaPadding,
    //     -height * 2,
    //     safeAreaLength,
    //     height * 4
    //   )
    // );

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = safeArea;
    innerOptions.outerModel = safeArea;

    console.log({ roundedOuterModel });

    const innerDesign = await this.subModel.make(paper, innerOptions);

    if (innerDesign.outline) {
      roundedOuterModel = roundedOuterModel.unite(innerDesign.outline);
    }

    return new CompletedModel({
      outer: roundedOuterModel,
      holes: holes,
      design: innerDesign.paths,
    });
  }
}
