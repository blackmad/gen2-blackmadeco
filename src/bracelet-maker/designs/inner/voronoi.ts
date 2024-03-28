import { Delaunay } from "d3-delaunay";

import {
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
} from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  approxShape,
  bufferPointstoPathItem,
  randomPointInPolygon,
} from "../../utils/paperjs-utils";
import { phyllotaxisPoints } from "../../utils/phyllotaxis-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

function dedupePointsArray(points: number[][]): number[][] {
  const pointsDict = {};
  const outputPoints = [];
  const precision = 4;

  points.forEach((point) => {
    const key = point.map((p) => p.toFixed(precision).toString()).join(",");
    if (!pointsDict[key]) {
      pointsDict[key] = key;
      outputPoints.push(point);
    }
  });

  return outputPoints;
}

export class InnerDesignVoronoi extends FastAbstractInnerDesign {
  needSubtraction = true;
  allowOutline = true;
  canRound = true;

  makeRandomPoints({
    paper,
    boundaryModel,
    rows,
    cols,
    numTotalPoints,
    numBorderPoints,
    mirror,
    pointStrategy,
    sunflowerAngle,
    sunflowerScalingParam,
  }) {
    const numPoints = numTotalPoints; // (rows * cols);

    const colOffset = boundaryModel.bounds.width / cols;
    const rowOffset = boundaryModel.bounds.height + 1 / rows;

    addToDebugLayer(paper, "boundaryModel", boundaryModel.bounds.topLeft);
    addToDebugLayer(paper, "boundaryModel", boundaryModel);

    const partialRect = new paper.Rectangle(
      boundaryModel.bounds.topLeft,
      new paper.Size(colOffset, rowOffset)
    );

    addToDebugLayer(
      paper,
      "partialRect",
      new paper.Path.Rectangle(
        new paper.Rectangle(
          boundaryModel.bounds.topLeft,
          new paper.Size(colOffset, rowOffset)
        )
      )
    );

    addToDebugLayer(paper, "sanity", new paper.Point(1, 1));
    addToDebugLayer(
      paper,
      "sanity",
      new paper.Point(1, 1).add(boundaryModel.bounds.topLeft)
    );

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const partialRect = new paper.Rectangle(
          boundaryModel.bounds.topLeft.add(
            new paper.Point(c * colOffset, r * rowOffset)
          ),
          new paper.Size(colOffset, rowOffset)
        );
        addToDebugLayer(
          paper,
          "partialRect",
          new paper.Path.Rectangle(partialRect)
        );
      }
    }

    const seedPoints = [];

    const addSeedPoint = (testPoint: paper.Point, layerName: string) => {
      // I've gone back and forth on if these should be 0->rows, or -1 -> rows +1 (or +2??)
      // increasingly the bounds obvioiusly helps a bit with periodicity of the pattern, making
      // sure it still looks like it's repeating at the edges. I don't know why I undid it at one point
      const startR = -1;
      const endR = rows + 1;
      const startC = -1;
      const endC = cols + 1;

      // if (rows > 1) {
      //   startR = -2;
      //   endR = rows + 2;
      // }

      // if (cols > 1) {
      //   startC = -2;
      //   endC = cols + 2;
      // }

      for (let r = startR; r < endR; r++) {
        for (let c = startC; c < endC; c++) {
          const relativePoint = testPoint.subtract(
            boundaryModel.bounds.topLeft
          );

          let x = testPoint.x + colOffset * c;
          let y = testPoint.y + rowOffset * r;

          if (mirror && c % 2 == 1) {
            x =
              colOffset * (c + 1) +
              boundaryModel.bounds.topLeft.x -
              relativePoint.x;
          }

          if (mirror && r % 2 == 1) {
            y =
              rowOffset * (r + 1) +
              boundaryModel.bounds.topLeft.y -
              relativePoint.y;
          }

          addToDebugLayer(paper, layerName, new paper.Point(x, y));
          seedPoints.push([x, y]);
        }
      }
    };

    const generatePoints = (): paper.PointLike[] => {
      if (pointStrategy === "random") {
        return generateRandomPoints();
      } else if (pointStrategy === "sunflower") {
        return phyllotaxisPoints({
          paper,
          boundaryModel,
          numDots: numPoints,
          angle: sunflowerAngle,
          scalingParam: sunflowerScalingParam,
        });
      }
      return [];
    };

    const generateRandomPoints = (): paper.PointLike[] => {
      const points: paper.PointLike[] = [];
      for (let i = 0; i < numPoints; i++) {
        const testPoint = randomPointInPolygon(paper, partialRect, this.rng);
        if (!testPoint) {
          continue;
        }
        points.push(testPoint);
      }
      return points;
    };

    const originalPoints = generatePoints();
    originalPoints.forEach((point) => {
      addToDebugLayer(paper, "initialPoints", point);
      addSeedPoint(point, "seedPoints");
    });

    if (numBorderPoints > 0) {
      // console.log(approxShape(paper, partialRect, numBorderPoints));
      approxShape(
        paper,
        new paper.Path.Rectangle(partialRect),
        numBorderPoints
      ).forEach((p) => addSeedPoint(p, "borderPoints"));
    }

    return seedPoints;
  }

  makeDesign(paper: paper.PaperScope, params: any) {
    const {
      numPoints = 100,
      rows = 1,
      cols = 1,
      numBorderPoints = 0,
      mirror = false,
      removeEdgePolygons = false,
      borderSize = 0,
      pointStrategy = "random",
      sunflowerAngle,
      sunflowerScalingParam,
    } = params;

    const boundaryModel: paper.PathItem = params.boundaryModel;
    const expandedBoundaryModel = new paper.Path.Rectangle(
      boundaryModel.bounds.expand(borderSize)
    );

    const seedPoints = this.makeRandomPoints({
      paper,
      boundaryModel: expandedBoundaryModel,
      rows,
      cols,
      numTotalPoints: numPoints,
      numBorderPoints,
      mirror,
      pointStrategy,
      sunflowerAngle,
      sunflowerScalingParam,
    });

    // console.log(seedPoints.length);
    // console.log(seedPoints);
    // console.log(JSON.stringify(seedPoints));

    const delaunay = Delaunay.from(dedupePointsArray(seedPoints));
    let cellPolygonIterator;

    if (params.voronoi) {
      const voronoi = delaunay.voronoi([
        expandedBoundaryModel.bounds.x,
        expandedBoundaryModel.bounds.y,
        expandedBoundaryModel.bounds.x + expandedBoundaryModel.bounds.width,
        expandedBoundaryModel.bounds.y + expandedBoundaryModel.bounds.height,
      ]);
      cellPolygonIterator = voronoi.cellPolygons();
    } else {
      cellPolygonIterator = delaunay.trianglePolygons();
    }

    const polys = [];
    for (const cellPolygon of cellPolygonIterator) {
      const points = cellPolygon.map((p) => new paper.Point(p[0], p[1]));

      const voronoiPath = new paper.Path(points);

      const top = voronoiPath.bounds.top;
      const isOnYEdge =
        almostEqual(voronoiPath.bounds.top, boundaryModel.bounds.top) ||
        almostEqual(voronoiPath.bounds.bottom, boundaryModel.bounds.bottom);

      points.pop();
      const bufferedShape = bufferPointstoPathItem(
        paper,
        -params.borderSize,
        points
      );

      if (!isOnYEdge || !removeEdgePolygons) {
        polys.push(bufferedShape);
        // polys.push(new paper.Path(points));
        addToDebugLayer(paper, "voronoiShape", voronoiPath);
        addToDebugLayer(paper, "bufferedVoronoiShape", bufferedShape.clone());
      }
    }

    const pathGroup = new paper.Group(polys);
    pathGroup.fitBounds(boundaryModel.bounds, true);

    return Promise.resolve({ paths: polys });
  }

  get designMetaParameters() {
    return [
      new SelectMetaParameter({
        title: "Point strategy",
        options: ["random", "sunflower"],
        value: "random",
        name: "pointStrategy",
      }),
      new RangeMetaParameter({
        title: "Num Points",
        min: 3,
        max: 100,
        value: 20,
        step: 1,
        name: "numPoints",
        randMin: 3,
        randMax: 30,
      }),
      new RangeMetaParameter({
        title: "Border Points",
        min: 0,
        max: 100,
        value: 0,
        step: 1,
        name: "numBorderPoints",
        randMin: 0,
        randMax: 10,
      }),
      // new RangeMetaParameter({
      //   title: 'Min Cell Size',
      //   min: 0.05,
      //   max: 1,
      //   value: 0.55,
      //   step: 0.01,
      //   name: 'minPathLength'
      // }),
      new RangeMetaParameter({
        title: "Border Size",
        min: 0.01,
        max: 0.5,
        value: 0.1,
        step: 0.01,
        name: "borderSize",
      }),
      new RangeMetaParameter({
        title: "Rows",
        min: 1,
        max: 20,
        value: 1,
        step: 1,
        name: "rows",
        randMin: 1,
        randMax: 3,
      }),
      new RangeMetaParameter({
        title: "Cols",
        min: 1,
        max: 20,
        value: 1,
        step: 1,
        name: "cols",
        randMin: 1,
        randMax: 3,
      }),
      new OnOffMetaParameter({
        title: "Mirror",
        value: true,
        name: "mirror",
      }),
      new OnOffMetaParameter({
        title: "Voronoi",
        value: true,
        name: "voronoi",
      }),
      new OnOffMetaParameter({
        title: "Remove Edge Polygons",
        value: false,
        name: "removeEdgePolygons",
      }),

      // sunflower params
      new RangeMetaParameter({
        title: "Sunflower Angle",
        min: 100,
        max: 200,
        step: 0.1,
        value: 137.5,
        name: "sunflowerAngle",
        group: "Sunflower Params",
        // shouldDisplay: (params: any) => params.pointStrategy === "sunflower",
      }),

      new RangeMetaParameter({
        title: "Sunflower Angle",
        min: 0.0001,
        max: 1,
        step: 0.005,
        value: 0.2,
        name: "sunflowerScalingParam",
        group: "Sunflower Params",
        // shouldDisplay: (params: any) => params.pointStrategy === "sunflower",
      }),
    ];
  }
}
