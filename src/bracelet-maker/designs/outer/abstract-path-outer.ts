import { PaperOffset } from "paperjs-offset";

import {
  MetaParameter,
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
} from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addEarringHoleToModel } from "../../utils/earring-utils";
import { roundCorners } from "../../utils/round-corners";

export abstract class AbstractPathOuter extends OuterPaperModelMaker {
  public abstractPathOuterMetaParameters({
    shouldRoundCorners = false,
  }: {
    shouldRoundCorners?: boolean;
  }): MetaParameter<any>[] {
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
      new OnOffMetaParameter({
        title: "Round Corners",
        value: shouldRoundCorners,
        name: "shouldRoundCorners",
      }),
      new OnOffMetaParameter({
        title: "Earring Hole",
        value: false,
        name: "earringHole",
      }),
      new SelectMetaParameter({
        title: "Earring Hole Position",
        options: [
          "Outside-Top",
          "Outside-Bottom",
          "Inside-Top",
          "Inside-Bottom",
        ],
        value: "Outside-Top",
        name: "earringHolePosition",
      }),
      new RangeMetaParameter({
        title: "Earring Hole Inner Size",
        min: 0.1,
        max: 20,
        value: 0.04,
        step: 0.01,
        name: "earringHoleInnerSize",
      }),
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  abstract makeOuterModel(
    paper: paper.PaperScope,
    params: any
  ): Promise<paper.PathItem>;

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const params = options[this.constructor.name];
    const { shouldRoundCorners } = params;

    let outerModel = await this.makeOuterModel(paper, params);
    outerModel = shouldRoundCorners
      ? roundCorners({ paper, path: outerModel, radius: 0.1 })
      : outerModel;

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = PaperOffset.offset(outerModel.clone(), 5, {
      limit: 1,
    });
    // innerOptions.safeCone = outerModel;
    innerOptions.outerModel = outerModel;

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    let finalOuterModel = innerDesign.outline
      ? outerModel.unite(innerDesign.outline)
      : outerModel;

    if (params.earringHole) {
      finalOuterModel = addEarringHoleToModel({
        paper,
        earringHoleInnerSize: params.earringHoleInnerSize,
        earringHolePosition: params.earringHolePosition,
        model: finalOuterModel,
        safeBorderWidth: innerOptions.safeBorderWidth,
      });
    }

    return new CompletedModel({
      outer: finalOuterModel,
      holes: [],
      design: innerDesign.paths,
    });
  }
}
