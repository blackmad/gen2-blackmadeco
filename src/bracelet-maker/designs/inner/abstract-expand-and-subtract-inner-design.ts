import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { polygonize } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

function slope(a, b) {
  if (a.x == b.x) {
    return null;
  }

  return (b.y - a.y) / (b.x - a.x);
}

function yIntercept(point, slope) {
  if (slope === null) {
    // vertical line
    return point.x;
  }

  return point.y - slope * point.x;
}

export abstract class AbstractExpandInnerDesign extends FastAbstractInnerDesign {
  get designMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Line Width",
        min: 0.02,
        max: 0.5,
        value: 0.1,
        step: 0.001,
        name: "lineWidth",
      }),
      ...this.pathDesignMetaParameters,
    ];
  }
  abstract pathDesignMetaParameters: MetaParameter<any>[];

  abstract makePaths(scope: paper.PaperScope, params): Promise<paper.Point[][]>;

  async makeDesign(
    paper: paper.PaperScope,
    params
  ): Promise<{ paths: paper.PathItem[] }> {
    const lines = await this.makePaths(paper, params);
    return { paths: polygonize(paper, lines, -params.lineWidth / 2) };
  }
}
