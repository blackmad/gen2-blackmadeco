import { AbstractPathOuter } from "./abstract-path-outer";

export class EllipseOuter extends AbstractPathOuter {
  get outerMetaParameters() {
    return [
      ...super.abstractPathOuterMetaParameters({
        shouldRoundCorners: false,
      }),
    ];
  }
  makeOuterModel(paper: paper.PaperScope, params: any): paper.PathItem {
    const { height, width } = params;
    const rectangle = new paper.Rectangle(
      new paper.Point(0, 0),
      new paper.Size(height, width)
    );
    return new paper.Path.Ellipse(rectangle);
  }
}
