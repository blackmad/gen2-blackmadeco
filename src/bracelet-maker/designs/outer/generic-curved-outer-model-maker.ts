// TODO: add incisions
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";

export abstract class GenericCurvedOuterModelMaker extends OuterPaperModelMaker {
  constructor(public subModel: any) {
    super();
  }

  abstract makePath(paper: paper.PaperScope, params: any): Promise<paper.Path>;

  public async make(
    paper: paper.PaperScope,
    options: any
  ): Promise<CompletedModel> {
    const outerModel = await this.makePath(
      paper,
      options[this.constructor.name]
    );

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
