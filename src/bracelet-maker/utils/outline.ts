import concaveman from "concaveman";

import { addToDebugLayer } from "./debug-layers";
import {
  flattenArrayOfPathItems,
  makeSymmetric,
  unkinkPath,
} from "./paperjs-utils";
import { reTracePaperPath } from "./potrace-utils";

export async function makeConcaveOutline({
  paper,
  paths,
  concavity,
  lengthThreshold,
  minimumOutlinePath,
  symmetric,
}: {
  paper: paper.PaperScope;
  paths: paper.PathItem[];
  concavity: number;
  lengthThreshold: number;
  minimumOutlinePath: paper.PathItem;
  symmetric: boolean;
}): Promise<paper.Path> {
  const allPoints = [];
  paths.forEach((p) => addToDebugLayer(paper, "outlinePaths", p.clone()));

  function addPoint(point: paper.Point, force: boolean = false) {
    if (point && (!point.isInside(minimumOutlinePath.bounds) || force)) {
      allPoints.push([point.x, point.y]);
      addToDebugLayer(paper, "outlinePoints", point);
    }
  }

  const flattenedPaths = flattenArrayOfPathItems(paper, paths);
  flattenedPaths.forEach((path: paper.Path) => {
    path.segments.forEach((s) => addPoint(s.point, true));
    for (let offset = 0; offset < 1; offset += 0.05) {
      addPoint(path.getPointAt(path.length * offset), true);
    }
  });

  // const minimumOutlinePaths = flattenArrayOfPathItems(paper, [
  //   minimumOutlinePath,
  // ]);
  // minimumOutlinePaths.forEach((path: paper.Path) => {
  //   for (let offset = 0; offset < 1; offset += 0.01) {
  //     addPoint(path.getPointAt(path.length * offset), true);
  //   }
  // });

  const concaveHull = concaveman(allPoints, concavity, lengthThreshold);
  const concavePath = new paper.Path(
    concaveHull.map((p) => new paper.Point(p[0], p[1]))
  );
  concavePath.closePath();
  addToDebugLayer(paper, "concavePath", concavePath.clone());
  // const concavePath = unkinkPath(paper, concavePath);

  // let's make this symmetrical

  addToDebugLayer(paper, "cleanedUpConcavePath", concavePath.clone());

  const symmetricalPath = symmetric
    ? makeSymmetric(paper, concavePath)
    : concavePath;

  const tracedItem = await reTracePaperPath({
    paper,
    item: symmetricalPath,
    options: {},
  });

  unkinkPath(paper, tracedItem);

  addToDebugLayer(paper, "tracedItem", tracedItem.clone());

  return tracedItem;
}
