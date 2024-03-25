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
        step: 0.1,
        name: "outerHeightMultiplier",
      }),
      new RangeMetaParameter({
        title: "Outer Width",
        min: 0.1,
        max: 20,
        value: 8.5,
        step: 0.1,
        name: "outerWidth",
      }),
      new RangeMetaParameter({
        title: "Inner Height Multiplier",
        min: 0.1,
        max: 20,
        value: 1.1,
        step: 0.1,
        name: "innerHeightMultiplier",
      }),
      new RangeMetaParameter({
        title: "Inner Width",
        min: 0.1,
        max: 20,
        value: 6.5,
        step: 0.1,
        name: "innerWidth",
      }),
      new RangeMetaParameter({
        title: "innerYOffset",
        min: 0,
        max: 20,
        value: 0.5,
        step: 0.01,
        name: "innerYOffset",
      }),
      new RangeMetaParameter({
        title: "Cut Height Percentage",
        min: 0,
        max: 1,
        value: 0.5,
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
      cutHeightPercentage,
      innerYOffset,
    } = options[this.constructor.name];

    const outerHeight = outerWidth * outerHeightMultiplier;
    const outerRectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(outerWidth, outerHeight)
    );

    const outerEllipse = new paper.Path.Ellipse(outerRectangle);

    const innerRectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(innerWidth, innerWidth * innerHeightMultiplier)
    );
    innerRectangle.center = outerRectangle.center.add(
      new paper.Point(0, -innerYOffset)
    );

    const innerEllipse = new paper.Path.Ellipse(innerRectangle);
    addToDebugLayer(paper, "rectangles", innerRectangle);
    addToDebugLayer(paper, "rectangles", outerRectangle);

    const outerModel = outerEllipse.subtract(innerEllipse, { insert: true });
    const originalOuterModel = outerModel.clone();
    addToDebugLayer(paper, "outerModel", originalOuterModel);

    if (false && cutHeightPercentage) {
      console.log({ cutHeightPercentage, outerHeight });
      const cutTopRect = new paper.Path.Rectangle(
        new paper.Point(-outerWidth / 2, 0),
        new paper.Size(outerWidth * 2, outerHeight * cutHeightPercentage)
      );
      outerModel = outerModel.subtract(cutTopRect);
      addToDebugLayer(paper, "cutTopRect", cutTopRect);
    }

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

    console.log({ outerModel });

    return new CompletedModel({
      outer: originalOuterModel,
      holes: [],
      design: [], //innerDesign.paths,
    });
  }
}
