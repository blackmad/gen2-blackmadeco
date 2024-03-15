import { RangeMetaParameter, MetaParameter } from "../../meta-parameter";
import * as _ from "lodash";

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
        name: "height"
      }),
      new RangeMetaParameter({
        title: "TopWidth",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "topWidth"
      }),
      new RangeMetaParameter({
        title: "Bottom Width",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "bottomWidth"
      }),
      new RangeMetaParameter({
        title: "Smoothing Factor",
        min: 0.00,
        max: 1.0,
        value: 0.0,
        step: 0.01,
        name: "smoothingFactor"
      })
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  public controlInfo = "It's a box";

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    let { height, topWidth, bottomWidth, debug = false, smoothingFactor } = options[
      this.constructor.name
    ];

    let outerModel: paper.Path = new paper.Path();

    if (topWidth >= bottomWidth) {
      outerModel.add(new paper.Point(0, 0));
      outerModel.add(new paper.Point((topWidth - bottomWidth) / 2, height));
      outerModel.add(new paper.Point((topWidth - bottomWidth) / 2 + bottomWidth, height));
      outerModel.add(new paper.Point(topWidth, 0));
      outerModel.closePath();
    } else {
      outerModel.add(new paper.Point((bottomWidth - topWidth) / 2, 0));
      outerModel.add(new paper.Point(0, height));
      outerModel.add(new paper.Point(bottomWidth, height));
      outerModel.add(new paper.Point((bottomWidth - topWidth) / 2 + topWidth, 0));
      outerModel.closePath();
    }

    outerModel = roundCorners({ paper, path: outerModel, radius: smoothingFactor })

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.boundaryModel = outerModel;
    innerOptions.safeCone = outerModel.clone().scale(5, 5)
    innerOptions.outerModel = outerModel;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    if (innerDesign.outline) {
      const oldCuffOuter = outerModel;

      // @ts-ignore
      outerModel = outerModel.unite(innerDesign.outline);
    }

    return new CompletedModel({
      outer: outerModel,
      holes: [],
      design: innerDesign.paths
    });
  }
}
