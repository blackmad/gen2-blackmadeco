import m from "makerjs";

import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

function getEvenlySpacePointsAlongPath({
  path,
  numPoints,
}: {
  path: paper.Path;
  numPoints: number;
}): paper.Point[] {
  const points = [];
  const length = path.length;
  for (let i = 0; i < numPoints; i++) {
    const point = path.getPointAt(length * (i / numPoints));
    points.push(point);
  }
  return points;
}

export class InnerDesignSacredGeometry extends FastAbstractInnerDesign {
  allowOutline = false;
  requiresSafeConeClamp = false;
  needSubtraction = true;
  canKaleido = true;

  async makeDesign(paper: paper.PaperScope, params: any) {
    const boundaryModel: paper.Path = params.boundaryModel;

    function trussWireframe(w: number, h: number) {
      // const line = {
      //   type: "line",
      //   origin: [0, 0],
      //   end: [w, h],
      // };

      // const circle = {
      //   type: "circle",
      //   origin: [0, 0],
      //   radius: w,
      // };

      // const pathObject = { myLine: line, myCircle: circle };

      console.log(boundaryModel.bounds);

      const zeroedBoundaryModel = boundaryModel.clone();
      zeroedBoundaryModel.translate([
        -boundaryModel.bounds.x,
        -boundaryModel.bounds.y,
      ]);

      const points = getEvenlySpacePointsAlongPath({
        path: zeroedBoundaryModel,
        numPoints: 10,
      });
      points.forEach((p) => {
        addToDebugLayer(paper, "sacredGeometry", p);
      });

      const models = {
        box: new m.models.Rectangle(w, h),
      };

      const paths = {};

      points.forEach((p1, i) => {
        points.slice(i + 1).forEach((p2, j) => {
          paths[`line${i}-${j}`] = {
            type: "line",
            origin: [p1.x, p1.y],
            end: [p2.x, p2.y],
          };
        });
      });

      console.log({ models });

      const model = { models, paths };
      return model;
    }

    let truss = trussWireframe(
      boundaryModel.bounds.width,
      boundaryModel.bounds.height
    );
    truss = truss;
    truss = m.model.expandPaths(truss, 0.01);

    const svg = m.exporter.toSVG(truss);
    console.log(svg);

    const item = new paper.Item();
    const importedItem = item.importSVG(svg);
    console.log({ importedItem });
    const paths = flattenArrayOfPathItems(paper, [importedItem]);
    paths.forEach((p) => {
      addToDebugLayer(paper, "sacredGeometry", p);
    });

    return { paths: [] };
  }

  get designMetaParameters() {
    return [];
  }
}
