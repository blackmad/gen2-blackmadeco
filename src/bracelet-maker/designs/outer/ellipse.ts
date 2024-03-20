import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";

export class EllipseOuter extends OuterPaperModelMaker {
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
        title: "Width",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "width",
      }),
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  public controlInfo = "It's a circle";

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const { height, width } = options[this.constructor.name];

    const rectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(height, width)
    );

    const ellipse = new paper.Path.Ellipse(rectangle);

    const outerModel = ellipse;

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = outerModel.clone().scale(5, 5);
    innerOptions.outerModel = outerModel;

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const finalOuterModel = innerDesign.outline
      ? outerModel.unite(innerDesign.outline)
      : outerModel;

    return new CompletedModel({
      outer: finalOuterModel,
      holes: [],
      design: innerDesign.paths,
    });
  }
}
