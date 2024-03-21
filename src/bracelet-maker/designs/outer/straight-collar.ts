import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  makeBuckleStrapForBuckleSide,
  makeBuckleStrapForStrapSide,
} from "./buckle-helpers";

type ModelParameters = Record<string, number | string>;

export class StraightCollarOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
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
    const { height, neckSize } = options[this.constructor.name];

    const safeAreaPadding = 0.5;
    const safeAreaLength = neckSize;

    // Buckle holes
    const allHoles: paper.Path[][] = [];
    const { holes: buckleHoles, holeBounds: buckleHoleBounds } =
      makeBuckleStrapForBuckleSide({
        paper,
        height,
      });
    allHoles.push(buckleHoles);

    // belt holes
    const distanceToHoles =
      buckleHoleBounds.width + safeAreaPadding * 2 + safeAreaLength;
    const { holes, holeBounds } = makeBuckleStrapForStrapSide({
      paper,
      height,
      offsetX: distanceToHoles,
    });
    allHoles.push(holes);

    const holeStrapLength = holeBounds.width;
    const totalLength = distanceToHoles + holeStrapLength;

    let outerModel: paper.PathItem = new paper.Path.Rectangle(
      new paper.Rectangle(0, 0, totalLength, height),
      { height: height / 2, width: height / 2 }
    );
    addToDebugLayer(paper, "outerModel", outerModel.clone());

    const safeArea = new paper.Path.Rectangle(
      new paper.Rectangle(
        buckleHoleBounds.width + safeAreaPadding,
        0,
        safeAreaLength,
        height
      )
    );

    safeArea.strokeColor = new paper.Color("green");
    safeArea.strokeWidth = 0.001;
    // safeArea.remove();

    const safeCone = new paper.Path.Rectangle(
      new paper.Rectangle(
        buckleHoleBounds.width + safeAreaPadding,
        -height * 2,
        safeAreaLength,
        height * 4
      )
    );

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = safeCone;
    innerOptions.outerModel = outerModel;

    console.log({ outerModel });

    const innerDesign = await this.subModel.make(paper, innerOptions);

    if (innerDesign.outline) {
      outerModel = outerModel.unite(innerDesign.outline);
    }

    return new CompletedModel({
      outer: outerModel,
      holes: allHoles.flat(),
      design: innerDesign.paths,
    });
  }
}
