import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { roundCorners } from "../../utils/round-corners";

export class BoxOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Height",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "height",
      }),
      new RangeMetaParameter({
        title: "TopWidth",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "topWidth",
      }),
      new RangeMetaParameter({
        title: "Bottom Width",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "bottomWidth",
      }),
      new RangeMetaParameter({
        title: "Smoothing Factor",
        min: 0.0,
        max: 1.0,
        value: 0.0,
        step: 0.01,
        name: "smoothingFactor",
      }),
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  public controlInfo = "It's a box";

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const { height, topWidth, bottomWidth, smoothingFactor } =
      options[this.constructor.name];

    let outerModel: paper.Path = new paper.Path();

    if (topWidth >= bottomWidth) {
      outerModel.add(new paper.Point(0, 0));
      outerModel.add(new paper.Point((topWidth - bottomWidth) / 2, height));
      outerModel.add(
        new paper.Point((topWidth - bottomWidth) / 2 + bottomWidth, height)
      );
      outerModel.add(new paper.Point(topWidth, 0));
      outerModel.closePath();
    } else {
      outerModel.add(new paper.Point((bottomWidth - topWidth) / 2, 0));
      outerModel.add(new paper.Point(0, height));
      outerModel.add(new paper.Point(bottomWidth, height));
      outerModel.add(
        new paper.Point((bottomWidth - topWidth) / 2 + topWidth, 0)
      );
      outerModel.closePath();
    }

    outerModel = roundCorners({
      paper,
      path: outerModel,
      radius: smoothingFactor,
    });

    const originalOuterModel = outerModel.clone();

    console.log({ options });

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = outerModel.clone().scale(5, 5);
    innerOptions.outerModel = outerModel;

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const finalOuterModel = innerDesign.outline
      ? outerModel.unite(innerDesign.outline)
      : originalOuterModel;

    return new CompletedModel({
      outer: finalOuterModel,
      holes: [],
      design: innerDesign.paths,
    });
  }
}
