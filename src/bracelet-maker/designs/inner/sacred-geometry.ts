import { AbstractExpandInnerDesign } from "./abstract-expand-and-subtract-inner-design";

export class InnerDesignSacredGeometry extends AbstractExpandInnerDesign {
  async makePaths(paper: paper.PaperScope, params: any) {
    const boundaryModel: paper.Path = params.boundaryModel;

    const points = getEvenlySpacePointsAlongPath({
      path: boundaryModel,
      numPoints: 10,
    });

    const paths: paper.Point[][] = [];
    points.forEach((p1, i) => {
      points.slice(i + 1).forEach((p2, j) => {
        paths.push([p1, p2]);
      });
    });

    return paths;
  }

  get designMetaParameters() {
    return [];
  }
}
