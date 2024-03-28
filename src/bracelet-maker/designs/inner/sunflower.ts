import { RangeMetaParameter } from "../../meta-parameter";
import { cascadedUnion } from "../../utils/cascaded-union";
import { phyllotaxisPoints } from "../../utils/phyllotaxis-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignSunflower extends FastAbstractInnerDesign {
  allowOutline = false;
  needSubtraction = true;
  needSeed = false;

  makeDesign(paper: paper.PaperScope, params) {
    const { boundaryModel, scalingParam, angle, circleSize } = params;
    // φ = n ∗ 137.5◦
    // r = c√n,

    const numDots = 5000;

    const points = phyllotaxisPoints({
      paper,
      bounds: boundaryModel.bounds,
      numDots,
      angle,
      scalingParam,
    });

    const circles = points.flatMap((point) => {
      const circle = new paper.Path.Circle(point, circleSize);
      if (
        circle.isInside(boundaryModel.bounds) ||
        circle.intersects(boundaryModel)
      ) {
        return [circle];
      }
      return [];
    });

    return Promise.resolve({
      paths: cascadedUnion(circles),
    });
  }

  get designMetaParameters() {
    return [
      // new RangeMetaParameter({
      //   title: "Circle Size",
      //   min: 0.04,
      //   max: 0.5,
      //   value: 0.04,
      //   step: 0.01,
      //   name: "circleSize"
      // }),
      new RangeMetaParameter({
        title: "angle",
        min: 100,
        max: 140,
        value: 137.3,
        step: 0.2,
        name: "angle",
      }),
      new RangeMetaParameter({
        title: "Scaling Param",
        min: 0.01,
        max: 3.0,
        value: 0.1,
        step: 0.01,
        name: "scalingParam",
      }),
      new RangeMetaParameter({
        title: "Circle Size",
        min: 0.04,
        max: 0.75,
        value: 0.04,
        step: 0.01,
        name: "circleSize",
      }),
    ];
  }
}
