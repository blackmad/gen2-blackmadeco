import almostEqual from "almost-equal";
import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  clampPathsToBoundary,
  flattenArrayOfPathItems,
  makeSyntheticBoundaryModel,
} from "../../utils/paperjs-utils";

export class NecklaceOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Neck Size",
        min: 0.1,
        max: 20,
        value: 15.5,
        step: 0.1,
        name: "neckSize",
      }),
      new RangeMetaParameter({
        title: "Outer Height Multiplier",
        min: 0.1,
        max: 20,
        value: 1.7,
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
        max: 0.99,
        value: 1.3,
        step: 0.05,
        name: "innerHeightMultiplier",
      }),
      new RangeMetaParameter({
        title: "Inner Width Ratio",
        min: 1,
        max: 0.99,
        value: 0.85,
        step: 0.01,
        name: "innerWidthRatio",
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
      innerWidthRatio,
      outerHeightMultiplier,
      outerWidth,
      neckSize,
    } = options[this.constructor.name];

    const { outerModel, patternArea } = this.makeOuterRect({
      outerWidth,
      outerHeightMultiplier,
      innerWidthRatio,
      paper,
      innerHeightMultiplier,
      neckSize,
      extraDrop: 0,
    });

    const originalOuterModel = outerModel.clone();
    addToDebugLayer(paper, "outerModel", originalOuterModel);

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = new paper.Path.Rectangle(outerModel.bounds);

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    innerOptions.outerModel = makeSyntheticBoundaryModel(paper, outerModel);

    const innerDesign = await this.subModel.make(paper, innerOptions);
    const newSafeBoundaryModel = PaperOffset.offset(
      patternArea,
      -innerOptions.safeBorderWidth
    );

    const clampArea = newSafeBoundaryModel.clone();

    innerDesign.paths = clampPathsToBoundary(
      innerDesign.paths,
      clampArea,
      "tripleClamped"
    );

    console.log({ outerModel });

    return new CompletedModel({
      outer: originalOuterModel,
      holes: [],
      design: innerDesign.paths,
    });
  }

  private makeOuterRect({
    outerWidth,
    outerHeightMultiplier,
    innerWidthRatio,
    paper,
    innerHeightMultiplier,
    neckSize,
    extraDrop,
  }: {
    outerWidth: number;
    outerHeightMultiplier: number;
    innerWidthRatio: number;
    paper: paper.PaperScope;
    innerHeightMultiplier: number;
    neckSize: number;
    extraDrop: number;
  }) {
    const outerHeight = outerWidth * outerHeightMultiplier;
    const innerWidth = outerWidth * innerWidthRatio;

    const outerRectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(outerWidth, outerHeight)
    );

    const outerEllipse = new paper.Path.Ellipse(outerRectangle);

    const innerHeight = innerWidth * innerHeightMultiplier;
    const innerRectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(innerWidth, innerHeight)
    );

    innerRectangle.center = outerRectangle.center;

    const innerEllipse = new paper.Path.Ellipse(innerRectangle);
    addToDebugLayer(paper, "rectangles", innerRectangle);
    addToDebugLayer(paper, "rectangles", outerRectangle);

    let outerModel = outerEllipse.subtract(innerEllipse, { insert: true });

    // Create a rectangle for the top half of innerRectangle
    const cutTopRect = new paper.Path.Rectangle(
      [0, innerRectangle.center.y],
      new paper.Size(outerWidth, -outerHeight)
    );

    // Delete that from the outerModel
    outerModel = outerModel.subtract(cutTopRect);
    const patternArea = flattenArrayOfPathItems(paper, [outerModel.clone()])[0];

    // Find the segments with y = 0
    const outerModelPaths = flattenArrayOfPathItems(paper, [outerModel]);
    const topFlats = outerModelPaths.flatMap((path) => {
      return path.segments.filter((segment) => {
        console.log(segment.point, "vs", outerModel.bounds.y);
        return (
          almostEqual(segment.point.y, outerModel.bounds.y) &&
          almostEqual(segment.next.point.y, outerModel.bounds.y)
        );
      });
    });
    console.log({ topFlats });
    topFlats.forEach((segment) => {
      addToDebugLayer(
        paper,
        "topFlats",
        new paper.Path.Line(segment.point, segment.next.point)
      );
    });

    const currentSize = innerEllipse.length / 2;
    console.log("Ellipse half circumference", { currentSize });

    const extraNeckHeight = (neckSize - currentSize) / 2 + 2;
    console.log("padding out to " + extraNeckHeight);

    // Now for each topFlat make a rectangle going up from it
    const topFlatRects = topFlats.map((segment) => {
      const fakeLine = new paper.Path.Line(segment.point, segment.next.point);

      // make closing rects that are only rounded on the top
      const rect = new paper.Path.Rectangle(
        new paper.Rectangle(
          segment.point,
          new paper.Size(fakeLine.length, -extraNeckHeight)
        ),
        new paper.Size(0.1, 0.1)
      );

      const halfRect = new paper.Path.Rectangle(
        new paper.Rectangle(
          segment.point,
          new paper.Size(fakeLine.length, -extraNeckHeight / 2)
        )
      );

      addToDebugLayer(paper, "topFlatRects", rect);
      addToDebugLayer(paper, "topFlatRects", halfRect);
      return rect.unite(halfRect);
    });

    // And union all those rects to the top of our existing model
    const topFlatRectsUnion = new paper.CompoundPath({
      children: topFlatRects,
    });
    outerModel = outerModel.unite(topFlatRectsUnion);

    return { outerModel, patternArea };
  }
}
