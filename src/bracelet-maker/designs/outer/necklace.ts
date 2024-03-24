import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  clampPathsToBoundary,
  makeSyntheticBoundaryModel,
} from "../../utils/paperjs-utils";

export class NecklaceOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Outer Height Multiplier",
        min: 0.1,
        max: 20,
        value: 1.2,
        step: 0.01,
        name: "outerHeightMultiplier",
      }),
      new RangeMetaParameter({
        title: "Outer Width",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "outerWidth",
      }),
      new RangeMetaParameter({
        title: "Inner Height Multiplier",
        min: 0.1,
        max: 20,
        value: 1,
        step: 0.01,
        name: "innerHeightMultiplier",
      }),
      new RangeMetaParameter({
        title: "Inner Width",
        min: 0.1,
        max: 20,
        value: 2,
        step: 0.01,
        name: "innerWidth",
      }),
      new RangeMetaParameter({
        title: "Cut Height Percentage",
        min: 0.1,
        max: 20,
        value: 2,
        step: 0.01,
        name: "cutHeightPercentage",
      }),
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  public controlInfo = "It's a circle";

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const {
      innerHeightMultiplier,
      innerWidth,
      outerHeightMultiplier,
      outerWidth,
    } = options[this.constructor.name];

    const outerRectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(outerWidth, outerWidth * outerHeightMultiplier)
    );

    const outerEllipse = new paper.Path.Ellipse(outerRectangle);

    const innerRectangle = new paper.Rectangle(
      new paper.Point((outerWidth - innerWidth) / 2, -0.2),
      new paper.Size(innerWidth, innerWidth * innerHeightMultiplier)
    );

    const innerEllipse = new paper.Path.Ellipse(innerRectangle);
    addToDebugLayer(paper, "rectangles", innerRectangle);
    addToDebugLayer(paper, "rectangles", outerRectangle);

    const outerModel = outerEllipse.subtract(innerEllipse);

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = new paper.Path.Rectangle(outerModel.bounds);

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    innerOptions.outerModel = makeSyntheticBoundaryModel(paper, outerModel);

    const innerDesign = await this.subModel.make(paper, innerOptions);
    const newSafeBoundaryModel = PaperOffset.offset(
      outerModel,
      -innerOptions.safeBorderWidth,
      {
        jointType: "jtMiter",
        endType: "etClosedPolygon",
        miterLimit: 2.0,
        roundPrecision: 0.25,
      }
    );
    innerDesign.paths = clampPathsToBoundary(
      innerDesign.paths,
      newSafeBoundaryModel,
      "tripleClamped"
    );

    return new CompletedModel({
      outer: outerModel,
      holes: [],
      design: innerDesign.paths,
    });
  }
}
