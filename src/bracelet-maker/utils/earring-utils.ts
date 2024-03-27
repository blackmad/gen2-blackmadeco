import _ from "lodash";

import { addToDebugLayer } from "./debug-layers";

export function addEarringHoleToModel({
  paper,
  earringHoleInnerSize,
  earringHolePosition,
  model,
  safeBorderWidth,
}: {
  paper: paper.PaperScope;
  earringHoleInnerSize: number;
  earringHolePosition:
    | "Outside-Top"
    | "Outside-Bottom"
    | "Inside-Top"
    | "Inside-Bottom";
  model: paper.PathItem;
  safeBorderWidth: number;
}) {
  const outerCircleRadius = safeBorderWidth * 2;
  const innerCircle = new paper.Path.Circle({
    center: model.bounds.center,
    radius: earringHoleInnerSize,
  });
  const outerCircle = new paper.Path.Circle({
    center: model.bounds.center,
    radius: outerCircleRadius,
  });
  const earringHole = new paper.CompoundPath([outerCircle, innerCircle]);

  // find the middle intersection point
  const middleLine = new paper.Path.Line(
    model.bounds.topCenter,
    model.bounds.bottomCenter
  );
  middleLine.scale(2);
  addToDebugLayer(paper, "middleLine", middleLine);

  const middleIntersections = model.getIntersections(middleLine);
  const sortedMiddleIntersections = _.sortBy(
    middleIntersections,
    (p) => p.point.y
  );
  const middleIntersectionPoint = earringHolePosition.includes("Top")
    ? _.first(sortedMiddleIntersections)
    : _.last(sortedMiddleIntersections);

  const middleIntersection = middleIntersectionPoint?.point;
  if (!middleIntersection) {
    throw new Error("Couldn't find a place to put a hole");
  }

  addToDebugLayer(
    paper,
    "middleIntersectionPoint",
    middleIntersectionPoint.point
  );

  const offsetSignFlip = earringHolePosition.includes("Top") ? 1 : -1;

  // move the earring hole to the middle intersection point
  if (earringHolePosition.includes("Inside")) {
    const yOffset = -safeBorderWidth / 2 - outerCircleRadius / 2;
    earringHole.bounds.center = middleIntersection.subtract([
      0,
      offsetSignFlip * yOffset,
    ]);
    addToDebugLayer(paper, "earringHole", earringHole);

    return model.subtract(innerCircle);
  } else {
    earringHole.bounds.center = middleIntersection.subtract([
      0,
      (offsetSignFlip * outerCircleRadius) / 4,
    ]);
    addToDebugLayer(paper, "earringHole", earringHole);

    return model.unite(earringHole).subtract(innerCircle);
  }
}
