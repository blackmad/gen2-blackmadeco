import concaveman from "concaveman";

import { addToDebugLayer } from "./debug-layers";
import {
  flattenArrayOfPathItems,
  simplifyPath,
  unkinkPath,
} from "./paperjs-utils";

export function makeConcaveOutline({
  paper,
  paths,
  concavity,
  lengthThreshold,
  minimumOutlinePath,
}: {
  paper: paper.PaperScope;
  paths: paper.PathItem[];
  concavity: number;
  lengthThreshold: number;
  minimumOutlinePath: paper.PathItem;
}): paper.Path {
  const allPoints = [];
  paths.forEach((p) => addToDebugLayer(paper, "outlinePaths", p.clone()));

  function addPoint(point: paper.Point, force: boolean = false) {
    if (point && (!point.isInside(minimumOutlinePath.bounds) || force)) {
      allPoints.push([point.x, point.y]);
      addToDebugLayer(paper, "outlinePoints", point);
    }
  }

  paths.forEach((path: paper.Path) => {
    path.segments.forEach((s) => addPoint(s.point, true));
    for (let offset = 0; offset < 1; offset += 0.1) {
      addPoint(path.getPointAt(path.length * offset), true);
    }
  });

  const minimumOutlinePaths = flattenArrayOfPathItems(paper, [
    minimumOutlinePath,
  ]);
  minimumOutlinePaths.forEach((path: paper.Path) => {
    for (let offset = 0; offset < 1; offset += 0.01) {
      addPoint(path.getPointAt(path.length * offset), true);
    }
  });

  const concaveHull = concaveman(allPoints, concavity, lengthThreshold);
  const concavePath = new paper.Path(
    concaveHull.map((p) => new paper.Point(p[0], p[1]))
  );
  addToDebugLayer(paper, "concavePath", concavePath.clone());
  const unkinkedConcavePath = unkinkPath(paper, concavePath);

  // unkinkedConcavePath.flatten(0.05);
  // unkinkedConcavePath.smooth({ type: "catmull-rom", factor: 1.0 });
  // unkinkedConcavePath.flatten(0.05);
  unkinkedConcavePath.simplify(0.05);

  const simplifedPath = simplifyPath(paper, unkinkedConcavePath, 0.01);

  return unkinkedConcavePath;
}
