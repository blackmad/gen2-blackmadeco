import { RangeMetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { displayDataUriImageToConsole } from "../../utils/debug-utils";
import {
  flattenArrayOfPathItems,
  getEvenlySpacePointsAlongPath,
} from "../../utils/paperjs-utils";
import { traceFromBufferToSvgString } from "../../utils/potrace-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

type SeedPointMakerArgs = {
  boundaryModel: paper.Path;
  paper: paper.PaperScope;
  numPoints: number;
  seedPointLineShrink: number;
  seedShapeSides: number;
};

function makeRectangularSeedPoints({
  boundaryModel,
  paper,
}: SeedPointMakerArgs) {
  let points: paper.Point[] = [];

  new paper.Path.Rectangle(boundaryModel.bounds).segments.forEach((segment) => {
    const line = new paper.Path.Line(segment.previous.point, segment.point);
    line.scale(0.8);
    const newPoints = getEvenlySpacePointsAlongPath({
      path: line,
      numPoints: 3,
    });
    console.log(newPoints.length);
    points = points.concat(newPoints);
    addToDebugLayer(paper, "shurnkLine", line);
  });

  return points;
}

function makeHexagonalSeedPoints({
  boundaryModel,
  paper,
  numPoints,
  seedPointLineShrink,
  seedShapeSides,
}: SeedPointMakerArgs) {
  let points: paper.Point[] = [];

  const sides = seedShapeSides;

  const hexagon = new paper.Path.RegularPolygon({
    center: boundaryModel.bounds.center,
    sides,
    radius: boundaryModel.bounds.width / 2,
  });

  addToDebugLayer(paper, "hexagon", hexagon);

  hexagon.segments.forEach((segment) => {
    const line = new paper.Path.Line(segment.previous.point, segment.point);
    line.scale(seedPointLineShrink);
    const newPoints = getEvenlySpacePointsAlongPath({
      path: line,
      numPoints: numPoints,
    });
    console.log(newPoints.length);
    points = points.concat(newPoints);
    addToDebugLayer(paper, "shurnkLine", line);
  });

  return points;
}

function makeCircularSeedPoints({
  boundaryModel,
  paper,
  numPoints,
}: SeedPointMakerArgs) {
  const points: paper.Point[] = [];

  const center = boundaryModel.bounds.center;
  const radius = Math.max(
    boundaryModel.bounds.width / 2,
    boundaryModel.bounds.height / 2
  );
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    points.push(new paper.Point(x, y));
  }

  return points;
}

function makeSeedPoints(params: SeedPointMakerArgs) {
  return makeCircularSeedPoints(params);
}

export class InnerDesignSacredGeometry extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const {
      numPoints,
      shearY,
      xOffset,
      yOffset,
      borderWidth,
      seedPointLineShrink,
      seedShapeSides,
      minSpokeLength,
    } = params;
    const boundaryModel: paper.Path = params.boundaryModel;
    addToDebugLayer(paper, "boundaryModel", boundaryModel);

    const points = makeHexagonalSeedPoints({
      paper,
      boundaryModel,
      numPoints,
      seedPointLineShrink,
      seedShapeSides,
    });
    console.log(points.length);

    const lines: paper.Path.Line[] = makeFullyConnectedLinesFromPoints({
      points,
      paper,
      minSpokeLength,
    });

    const box = new paper.Group(lines);
    console.log("boxBounds", box.bounds);
    box.strokeColor = "black";
    box.strokeWidth = borderWidth * 0.3;
    box.fillColor = "red";

    const raster = box.rasterize({
      resolution: 10000,
    });
    const dataUri = raster.toDataURL();
    displayDataUriImageToConsole(dataUri);

    const base64data = dataUri.split(",")[1];
    const buffer = Buffer.from(base64data, "base64");
    const tracedSvgString = await traceFromBufferToSvgString({
      buffer,
      options: { optCurve: false },
    });

    const item = paper.project.importSVG(tracedSvgString, {
      expandShapes: true,
    });

    const scaleY = boundaryModel.bounds.height / item.bounds.height;
    const scaleX = boundaryModel.bounds.width / item.bounds.width;

    item.position = boundaryModel.bounds.center;
    item.scale(scaleX, scaleY * shearY, boundaryModel.bounds.center);
    addToDebugLayer(paper, "itemBounds2", item.bounds.clone());

    item.translate(xOffset, yOffset);

    const paths = flattenArrayOfPathItems(paper, [item]);
    // Find the biggest area path and remove it
    const biggestPath = paths.reduce((acc, path) => {
      return path.area < acc.area ? path : acc;
    });
    paths.splice(paths.indexOf(biggestPath), 1);

    const maxHoleSize = Math.max(...paths.map((p) => Math.abs(p.area)));
    const minHoleSize = maxHoleSize * params.minHoleSize;
    console.log({ minHoleSize });
    const filteredPaths = paths.filter(
      (p) => Math.abs(p.area) > Math.abs(minHoleSize)
    );

    return { paths: filteredPaths };
  }

  get designMetaParameters() {
    return [
      new RangeMetaParameter({
        title: "Number of Points",
        min: 2,
        max: 100,
        value: 3,
        step: 1,
        name: "numPoints",
      }),
      new RangeMetaParameter({
        title: "Shear Y",
        min: 0.1,
        max: 10,
        value: 5,
        step: 0.1,
        name: "shearY",
      }),
      new RangeMetaParameter({
        title: "X Offset",
        min: -5,
        max: 5,
        value: 0.1,
        step: 0.1,
        name: "xOffset",
      }),
      new RangeMetaParameter({
        title: "Y Offset",
        min: -5,
        max: 5,
        value: 0,
        step: 0.1,
        name: "yOffset",
      }),
      new RangeMetaParameter({
        title: "Border Width",
        min: 0.1,
        max: 1,
        value: 0.2,
        step: 0.01,
        name: "borderWidth",
      }),
      new RangeMetaParameter({
        title: "Seed Point Line Shrink",
        min: 0.1,
        max: 1,
        value: 0.2,
        step: 0.01,
        name: "seedPointLineShrink",
      }),
      new RangeMetaParameter({
        title: "Number of sides of the seed shape",
        min: 3,
        max: 100,
        value: 8,
        step: 1,
        name: "seedShapeSides",
      }),
      new RangeMetaParameter({
        title: "Min hole size (relative to largest)",
        min: 0,
        max: 1,
        value: 0,
        step: 0.01,
        name: "minHoleSize",
      }),
      new RangeMetaParameter({
        title: "Min spoke length (relative to largest)",
        min: 0,
        max: 1,
        value: 0,
        step: 0.01,
        name: "minSpokeLength",
      }),
    ];
  }
}
function makeFullyConnectedLinesFromPoints({
  points,
  paper,
  minSpokeLength,
}: {
  points: paper.Point[];
  paper: paper.PaperScope;
  minSpokeLength: number;
}) {
  const lines: paper.Path.Line[] = [];
  points.forEach((p1, i) => {
    addToDebugLayer(paper, "points", p1);
    console.log(p1);

    points.slice(i + 1).forEach((p2, j) => {
      const angle = p1.getAngle(p2);
      if (p1.getAngle(p2) < 10 || p2.getAngle(p1) < 10) {
        return;
      }
      // console.log(angle);
      // if (angle > 80 || angle < 10) {
      //   return;
      // }
      const line = new paper.Path.Line(p1, p2);
      line.strokeWidth = 0.001;
      line.strokeColor = "black";

      lines.push(line);
    });
  });

  const maxSpokeLength = Math.max(...lines.map((l) => Math.abs(l.length)));
  const minSpokeLengthAbsolute = minSpokeLength * maxSpokeLength;
  return lines.filter((l) => l.length > minSpokeLengthAbsolute);
}
