const Shape = require("@doodle3d/clipper-js");
import * as turfHelpers from "@turf/helpers";
import { Geometry } from "@turf/helpers";
import turfUnion from "@turf/union";
// import * as simplifyJS from 'simplify-js';
import turfUnkinkPolygon from "@turf/unkink-polygon";
import GeoJSON from "geojson";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader";
import Polygonizer from "jsts/org/locationtech/jts/operation/polygonize/Polygonizer";
import * as _ from "lodash";
import paper from "paper";
import simplify from "simplify-path";

import { addToDebugLayer } from "./debug-layers";

export function randomPointInPolygon(
  paper: paper.PaperScope,
  polygon: paper.PathItem,
  rng: () => number
): paper.Point | undefined {
  let bounds = null;
  if (polygon instanceof paper.Rectangle) {
    bounds = polygon;
  } else if (polygon instanceof paper.Path.Rectangle) {
    bounds = polygon.bounds;
  } else {
    throw "unknown type of polygon " + typeof polygon;
  }

  let found = false;
  while (!found) {
    const testPoint = new paper.Point(
      bounds.x + rng() * bounds.width,
      bounds.y + rng() * bounds.height
    );

    if (bounds.contains(testPoint)) {
      found = true;
      return testPoint;
    }
  }
}

export function bufferPoints(
  paper: paper.PaperScope,
  buffer: number,
  points: paper.Point[]
): paper.Point[] {
  const scaleFactor = 100;
  const scaledPoints = points.map((p) => {
    return { X: p.x * scaleFactor + 0.0001, Y: p.y * scaleFactor + 0.0001 };
  });
  const shape = new Shape.default([scaledPoints]);

  const roundedShape = shape.offset(buffer * scaleFactor, {
    jointType: "jtMiter",
    endType: "etClosedPolygon",
    miterLimit: 2.0,
    roundPrecision: 0.25,
  });

  if (!roundedShape || !roundedShape.paths || roundedShape.paths.length == 0) {
    return null;
  }

  return roundedShape.paths[0].map((p) => {
    return new paper.Point(p.X / 100, p.Y / 100);
  });
}

export function bufferPointstoPathItem(
  paper: paper.PaperScope,
  buffer: number,
  points: paper.Point[]
): paper.Path {
  const newPoints = bufferPoints(paper, buffer, points);

  const roundedPolygon = new paper.Path(newPoints);
  roundedPolygon.closePath();

  return roundedPolygon;
}

export function getPointsFromPath(shape: paper.Path): paper.Point[] {
  return (shape && shape.segments && shape.segments.map((s) => s.point)) || [];
}

export function bufferPath(
  paper: paper.PaperScope,
  buffer: number,
  shape: paper.PathItem
): paper.PathItem {
  return bufferPointstoPathItem(paper, buffer, getPointsFromPath(shape));
}

export function pickPointOnRectEdge(
  paper: paper.PaperScope,
  box: paper.Rectangle,
  rng: () => number
) {
  const randomPoint = rng() * (box.width * 2 + box.height * 2);
  if (randomPoint > 0 && randomPoint < box.height) {
    return new paper.Point(0 + box.x, box.height - randomPoint + box.y);
  } else if (randomPoint > box.height && randomPoint < box.height + box.width) {
    return new paper.Point(randomPoint - box.height + box.x, 0 + box.y);
  } else if (
    randomPoint > box.height + box.width &&
    randomPoint < box.height * 2 + box.width
  ) {
    return new paper.Point(
      box.width + box.x,
      randomPoint - (box.width + box.height) + box.y
    );
  } else {
    return new paper.Point(
      box.width - (randomPoint - (box.height * 2 + box.width)) + box.x,
      box.height + box.y
    );
  }
}

export function randomLineEndpointsOnRectangle(
  paper: paper.PaperScope,
  model: paper.Rectangle,
  rng: () => number
): paper.Point[] {
  const p1 = pickPointOnRectEdge(paper, model, rng);
  let p2 = pickPointOnRectEdge(paper, model, rng);
  while (p2.x == p1.x || p2.y == p1.y) {
    p2 = pickPointOnRectEdge(paper, model, rng);
  }
  return [p1, p2];
}

export function randomLineOnRectangle(
  paper: paper.PaperScope,
  model: paper.Rectangle,
  rng?: () => number
): paper.Path.Line {
  const points = randomLineEndpointsOnRectangle(paper, model, rng);
  return new paper.Path.Line(points[0], points[1]);
}

export class SimpleCircle {
  constructor(
    public x: number,
    public y: number,
    public radius: number
  ) {}
}

export function checkCircleCircleIntersection(
  c1: SimpleCircle,
  c2: SimpleCircle,
  border?: number
): boolean {
  const xDistance = c1.x - c2.x;
  const yDistance = c1.y - c2.y;

  const sumOfRadii = c1.radius + c2.radius + (border || 0);
  const distanceSquared = xDistance * xDistance + yDistance * yDistance;

  return distanceSquared < sumOfRadii * sumOfRadii;
}

export function approxShape(paper, shape, numPointsToGet = 200): paper.Point[] {
  // console.log('in appro: ', shape);
  const points = [];
  let shapeToUse = shape;

  if (shape instanceof paper.CompoundPath) {
    shapeToUse = shape.children[0];
  }

  // console.log(actualPath)
  for (let i = 0; i < numPointsToGet; i++) {
    points.push(
      shapeToUse.getPointAt((i / numPointsToGet) * shapeToUse.length)
    );
  }

  return points.map((point) => shapeToUse.localToGlobal(point));
}

export function paperPointsToGeoJsonLineString(
  points: paper.Point[]
): GeoJSON.LineString {
  return {
    type: "LineString",
    coordinates: points.map((point) => [point.y, point.x]),
  };
}

export function paperRectToGeoJsonLineString(
  rect: paper.Rectangle
): GeoJSON.LineString {
  return paperPointsToGeoJsonLineString(paperRectToPoints(rect));
}

export function paperRectToPoints(rect: paper.Rectangle) {
  return [
    rect.topLeft,
    rect.bottomLeft,
    rect.bottomRight,
    rect.topRight,
    rect.topLeft,
  ];
}

export function jstsGeometryToPaperJsGeometry(
  paper: paper.PaperScope,
  geom: jsts.geom.Geometry
): paper.Path | null {
  if (geom) {
    const coords = geom.getCoordinates();
    const points = coords.map((c) => new paper.Point(c.y, c.x));
    return new paper.Path(points);
  } else {
    return null;
  }
}

export function geojsonFeatureToPaperJs(
  paper: paper.PaperScope,
  feature: GeoJSON.Feature
): paper.Path {
  if (feature.geometry.type === "Polygon") {
    const coords = (feature.geometry as GeoJSON.Polygon).coordinates;
    const points = coords[0].map((c) => {
      return new paper.Point(c[1], c[0]);
    });
    return new paper.Path(points);
  }
  return null;
}

export function polygonize(
  paper: paper.PaperScope,
  shapes: paper.Point[][],
  buffer?: number
): paper.Path[] {
  const reader = new GeoJSONReader();
  const polygonizer = new Polygonizer();

  // polygonizer.setCheckRingsValid(false);

  const geojsonLineStrings: GeoJSON.LineString[] = shapes.map(
    paperPointsToGeoJsonLineString
  );
  const geoms: Array<Geometry> = geojsonLineStrings.map((l) => reader.read(l));

  let cleaned: Geometry = null;
  geoms.forEach(function (geom, i, _array) {
    if (i === 0) {
      cleaned = geom;
    } else {
      cleaned = turfUnion(cleaned, geom);
    }
  });

  polygonizer.add(cleaned);

  const polygons = polygonizer.getPolygons().array;
  // console.log(polygons);

  const paperPolys = polygons.map((_polygon: jsts.geom.Polygon) => {
    let polygon: jsts.geom.Geometry = _polygon;
    if (buffer) {
      polygon = _polygon.buffer(buffer, null, null);
    }
    return jstsGeometryToPaperJsGeometry(paper, polygon);
  });

  return _.compact(paperPolys);
}

export function flattenArrayOfPathItems(
  paper: paper.PaperScope,
  _paths: paper.Item[] | paper.Item
): paper.Path[] {
  const paths = _.isArray(_paths) ? _paths : [_paths];

  const ret: paper.Path[] = [];
  paths.forEach((path) => {
    if (path instanceof paper.CompoundPath || path instanceof paper.Group) {
      flattenArrayOfPathItems(paper, path.children).forEach((c) => {
        ret.push(c);
      });
    } else if (path instanceof paper.Path) {
      ret.push(path);
    }
  });
  return ret;
}

export function bufferLine(
  paper: paper.PaperScope,
  points: paper.Point[],
  lineWidth: number
): paper.Path {
  let hackedPoints = [...points];
  hackedPoints.reverse();
  if (hackedPoints.length == 2) {
    const tmpLine = new paper.Path(hackedPoints);
    hackedPoints = [
      hackedPoints[0],
      tmpLine.getPointAt(tmpLine.length * 0.5),
      hackedPoints[1],
    ];
  }
  hackedPoints = hackedPoints.concat(points);

  const fatLinePoints = bufferPoints(paper, lineWidth / 2, hackedPoints);

  if (fatLinePoints) {
    const path = new paper.Path(fatLinePoints);
    path.closePath();
    return path;
  } else {
    console.log("could not buffer line", points, hackedPoints);
    return null;
  }
}

export function getDistanceToLine(
  point: paper.Point,
  line: paper.Path.Line
): number {
  return point.getDistance(line.getNearestPoint(point));
}

export function containsOrIntersects({
  needle,
  haystack,
}: {
  needle: paper.PathItem;
  haystack: paper.Path;
}): boolean {
  return needle.isInside(haystack.bounds) || needle.intersects(haystack);
}

export function simplifyPathToPoints(
  path: paper.Path,
  tolerance: number = 0.005
): [number, number][] {
  const paperPoints = getPointsFromPath(path);
  const points = paperPoints.map((p) => [p.x, p.y]);
  return simplify(points, tolerance);
}

export function simplifyPath(
  paper: paper.PaperScope,
  path: paper.Path,
  tolerance: number = 0.001
): paper.Path {
  return new paper.Path(
    simplifyPathToPoints(path, tolerance).map((p) => new paper.Point(p))
  );
}

export function unkinkPath(
  paper: paper.PaperScope,
  path: paper.Path
): paper.Path {
  path.closePath();
  const paperPoints = getPointsFromPath(path);

  let coordinates: Array<Array<Array<number>>> = [];
  if (path instanceof paper.CompoundPath) {
    // shapeToUse = shape.children[0];
  } else {
    const paperPoints = getPointsFromPath(path);
    coordinates = [
      [
        ...paperPoints.map((p) => [p.x, p.y]),
        [paperPoints[0].x, paperPoints[0].y],
      ],
    ];
  }

  const polygon = turfHelpers.polygon(coordinates);
  const unkinkedTurfPolygon = turfUnkinkPolygon(polygon);
  const unkinkedPolygons = unkinkedTurfPolygon.features
    .slice(0, 1)
    .flatMap((feature) => {
      return feature.geometry.coordinates.slice(0, 1).map((polygon) => {
        const points = polygon.map(
          (coord) => new paper.Point(coord[0], coord[1])
        );

        return new paper.Path(points);
      });
    });

  return unkinkedPolygons[0];
}

// export function simplifyPathToPoints2(path: paper.Path, tolerance: number = 0.005): [number, number][] {
//   const paperPoints = getPointsFromPath(path);
//   // const points = paperPoints.map(p => [p.x, p.y]);
//   return simplifyJS(paperPoints, tolerance, true);
// }

// export function simplifyPath2(paper: paper.PaperScope, path: paper.Path, tolerance: number = 0.001): paper.Path {
//   return new paper.Path(simplifyPathToPoints2(path, tolerance).map(p => new paper.Point(p)));
// }

export function makeIncrementalPath(
  start: paper.PointLike,
  deltas: paper.PointLike[]
) {
  const path = new paper.Path();
  let currentPoint = new paper.Point(start);
  path.add(start);
  deltas.forEach((delta) => {
    currentPoint = currentPoint.add(delta);
    path.add(currentPoint);
  });
  return path;
}

export function getBounds(paths: paper.Path[]): paper.Rectangle {
  if (paths.length === 0) {
    return new paper.Rectangle([0, 0], [0, 0]);
  }
  let bounds = paths[0].bounds;
  paths.slice(1).forEach((path) => {
    bounds = bounds.unite(path.bounds);
  });
  return bounds;
}

export function translateAll(paths: paper.Path[], delta: paper.PointLike) {
  paths.forEach((path) => {
    path.translate(delta);
  });
}

export function makeRightRoundedRect(rect: paper.Rectangle) {
  const radius = rect.height / 2;
  const path = new paper.Path();
  path.moveTo(rect.topLeft);
  path.moveTo(rect.topRight.add([-radius, 0]));
  path.arcTo(rect.bottomRight.add([-radius, 0]));
  path.lineTo(rect.bottomLeft);
  path.lineTo(rect.topLeft);
  path.closePath();

  return path;
}

export function makeLeftRoundedRect(rect: paper.Rectangle) {
  const radius = rect.height / 2;
  const path = new paper.Path();
  path.moveTo(rect.topRight);
  path.lineTo(rect.bottomRight);
  path.lineTo(rect.bottomLeft.add([+radius, 0]));
  path.arcTo(rect.topLeft.add([+radius, 0]));
  path.lineTo(rect.topRight);
  path.closePath();
  return path;
}

export function clampPathsToBoundary(
  paths: paper.PathItem[],
  boundary: paper.PathItem,
  debugLayerName: string = "clampedPaths"
) {
  return paths.map((m) => {
    const newP = m.intersect(boundary, { insert: false });
    addToDebugLayer(paper, debugLayerName, newP.clone());
    return newP;
  });
}

export function hasHoles(path: paper.CompoundPath) {
  return path.children.length > 1;
}

// TODO: these should really find the paths of which they are holes of, and
// make the healing boxes the size of those paths, so we can do horizontal healing too
export function healHoles(params: {
  paper: paper.PaperScope;
  paths: paper.Item[];
  horizontalHealingBarHeight?: number;
  verticalHealingBarWidth?: number;
}): paper.Path[] {
  const { paper, paths, horizontalHealingBarHeight, verticalHealingBarWidth } =
    params;
  let ret: paper.PathItem[] = [];
  paths.forEach((path) => {
    if (path instanceof paper.CompoundPath) {
      const healBoxes = [];
      path.children.forEach((child) => {
        // debugger;
        // see if this has any holes
        if (child instanceof paper.Path && child.clockwise) {
          return;
        }

        if (verticalHealingBarWidth) {
          // make a rectangle the height of the group and width of healX
          const healRect = new paper.Path.Rectangle(
            child.bounds.center.subtract(
              new paper.Point(
                verticalHealingBarWidth / 2,
                child.bounds.height * 1.3
              )
            ),
            new paper.Size(verticalHealingBarWidth, child.bounds.height * 2.6)
          );

          healBoxes.push(healRect);
          addToDebugLayer(paper, "healRect", healRect);
        }

        if (horizontalHealingBarHeight) {
          // make a rectangle the width of the group and height of healY
          const healRect = new paper.Path.Rectangle(
            child.bounds.center.subtract(
              new paper.Point(
                child.bounds.width,
                horizontalHealingBarHeight / 2
              )
            ),
            new paper.Size(child.bounds.width * 2, horizontalHealingBarHeight)
          );

          healBoxes.push(healRect);
          addToDebugLayer(paper, "healRect", healRect);
        }
      });
      let fixedPath = path;
      for (let i = 0; i < healBoxes.length; i++) {
        fixedPath = fixedPath.subtract(healBoxes[i], {
          insert: false,
        });
      }
      ret.push(fixedPath);
    } else if (path instanceof paper.Group) {
      ret = [...ret, ...healHoles({ ...params, paths: path.children })];
    } else if (path instanceof paper.Path) {
      ret.push(path);
    }
  });
  return ret;
}

export function getEvenlySpacePointsAlongPath({
  path,
  numPoints,
}: {
  path: paper.Path;
  numPoints: number;
}): paper.Point[] {
  const points = [];
  const length = path.length;
  for (let i = 0; i < numPoints; i++) {
    const point = path.getPointAt(length * (i / (numPoints - 1)));
    points.push(point);
  }
  return points;
}

export function removeSharpAngles({ item }: { item: paper.Item }) {
  const paths = flattenArrayOfPathItems(paper, [item]);

  const segmentsToRemove: paper.Segment[] = [];
  paths.forEach((path) => {
    path.segments.forEach((segment, segmentIndex) => {
      if (!segment.previous || !segment.next) {
        return;
      }
      // console.log({ segment }, segment.point, segment.previous, segment.next);
      const point1 = segment.previous.point.subtract(segment.point);
      const point2 = segment.next.point.subtract(segment.point);
      const angle = point1.getDirectedAngle(point2);

      console.log({ angle });
      if (Math.abs(angle) % 90 < 45) {
        segmentsToRemove.push(segment);
      }
    });
  });
  segmentsToRemove.forEach((segment) => {
    segment.remove();
  });
}

export function makeSyntheticBoundaryModel(
  paper: paper.PaperScope,
  path: paper.PathItem
) {
  // First let's find where the middle is
  // Create a line to intersect the middle
  const middleLine = new paper.Path.Line(
    path.bounds.topCenter,
    path.bounds.bottomCenter.add([0, 1])
  );
  const middleIntersections = path.getIntersections(middleLine);

  const middleDistance = middleIntersections[0].point.getDistance(
    middleIntersections[1].point
  );

  console.log(middleDistance);

  const distanceAbove = path.bounds.height - middleDistance;
  const newTotalHeight = distanceAbove * 2 + middleDistance;

  console.log("middleDistance", { middleDistance });

  addToDebugLayer(paper, "middleLine", middleLine);
  // addToDebugLayer(paper,  "middleLine", clampedMiddleLine);

  const syntheticBoundaryModel = new paper.Path.Rectangle(
    new paper.Rectangle(
      path.bounds.topLeft,
      new paper.Size(path.bounds.width, newTotalHeight)
    )
  );

  addToDebugLayer(paper, "syntheticBoundaryModel", syntheticBoundaryModel);

  return syntheticBoundaryModel;
}

export function getOnlyCounterclockwisePaths(params: {
  paper: paper.PaperScope;
  paths: paper.Item[];
}): paper.Item[] {
  const { paper, paths } = params;
  let ret: paper.PathItem[] = [];
  paths.forEach((path) => {
    if (path instanceof paper.CompoundPath) {
      path.children.forEach((child) => {
        // debugger;
        // see if this has any holes
        if (child instanceof paper.Path) {
          if (child.clockwise) {
            console.log("found a clockwise path", child.area);

            ret.push(child);
            addToDebugLayer(paper, "clockwise", child);
            // child.remove();
            return;
          } else {
            console.log("found a counterclock path", child.bounds.area);
            addToDebugLayer(paper, "counterclockwise", child);
          }
        }
        // ret.push(child);
      });
      // ret.push(fixedPath);
    } else if (path instanceof paper.Group) {
      ret = [
        ...ret,
        ...getOnlyCounterclockwisePaths({ ...params, paths: path.children }),
      ];
    } else if (path instanceof paper.Path) {
      ret.push(path);
    }
  });
  return ret;
}

export function mirrorPath({
  path,
  orientation,
}: {
  path: paper.Path;
  orientation: "horizontal" | "vertical";
}) {
  const axis = {
    horizontal: {
      x: -1,
      y: 1,
    },
    vertical: {
      x: 1,
      y: -1,
    },
  };
  const newPath = path.clone();
  newPath.scale(axis[orientation].x, axis[orientation].y);
  return newPath;
}

export function makeSymmetric(paper: paper.PaperScope, path: paper.Path) {
  const mirroredPath = mirrorPath({
    path,
    orientation: "horizontal",
  });
  mirroredPath.bounds.center = path.bounds.center;
  addToDebugLayer(paper, "mirroredPath", mirroredPath.clone());

  // TODO: make this an option
  const symmetricalPath = mirroredPath.unite(path, { trace: "true" });
  addToDebugLayer(paper, "symmetricalPath", symmetricalPath);

  return symmetricalPath;
}

export function isInside(needle: paper.PathItem, haystack: paper.PathItem) {
  const paths = flattenArrayOfPathItems(paper, [needle]);
  const outerPaths = flattenArrayOfPathItems(paper, [haystack]);
  return paths.every((p) =>
    p.segments.every((s) => outerPaths.some((o) => o.contains(s.point)))
  );
}
