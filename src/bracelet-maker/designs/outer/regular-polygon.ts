import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { AbstractPathOuter } from "./abstract-path-outer";

export class RegularPolygonOuter extends AbstractPathOuter {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      ...super.outerMetaParameters,
      new RangeMetaParameter({
        title: "Sides",
        min: 3,
        max: 20,
        value: 8,
        step: 1,
        name: "sides",
      }),
    ];
  }

  makeOuterModel(paper: paper.PaperScope, params: any): paper.PathItem {
    const radius = Math.min(params.width, params.height) / 2;
    const widenScale =
      Math.max(params.width, params.height) /
      Math.min(params.width, params.height);
    const tall = params.height > params.width;

    const polygon = new paper.Path.RegularPolygon(
      new paper.Point(0, 0),
      params.sides,
      radius
    );

    polygon.scale(tall ? 1 : widenScale, tall ? widenScale : 1);

    return polygon;
  }
}
