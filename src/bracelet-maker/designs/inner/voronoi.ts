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
    mirrorX,
    mirrorY,
    pointStrategy,
    sunflowerAngle,
    sunflowerScalingParam,
    overlapInterferencePercentage,
  }) {
    const numPoints = numTotalPoints; // (rows * cols);

    const colOffset = boundaryModel.bounds.width / cols;
    const rowOffset = boundaryModel.bounds.height / rows;

    const partialRect: paper.Rectangle = new paper.Rectangle(
      boundaryModel.bounds.topLeft,
      new paper.Size(colOffset, rowOffset)
    );

    console.log(boundaryModel.bounds.topLeft);

    addToDebugLayer(paper, "boundaryModel", boundaryModel.bounds.topLeft);
    addToDebugLayer(paper, "boundaryModel", boundaryModel);

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

    const seedPoints: Array<[number, number]> = [];

    const addSeedPoint = (testPoint: paper.Point, layerName: string) => {
      seedPoints.push([testPoint.x, testPoint.y]);
      addToDebugLayer(paper, layerName, testPoint);
    };

    const generatePoints = (): paper.PointLike[] => {
      if (pointStrategy === "random") {
        return generateRandomPoints();
      } else if (pointStrategy === "sunflower") {
        return phyllotaxisPoints({
          paper,
          bounds: partialRect,
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

    // Reprocess the seedPoints
    const seedPoints2: Array<[number, number]> = [];
    let startR = 0;
    let endR = rows;
    let startC = 0;
    let endC = cols;

    if (overlapInterferencePercentage > 0) {
      const overlap = 1 - overlapInterferencePercentage / 100;
      startR -= overlap;
      endR += overlap;

      startC -= overlap;
      endC += overlap;
    }

    const pointGroup = new paper.Path(seedPoints);

    for (
      let r = startR;
      r < endR;
      r += 1 - overlapInterferencePercentage / 100
    ) {
      for (
        let c = startC;
        c < endC;
        c += 1 - overlapInterferencePercentage / 100
      ) {
        const newPoints = pointGroup.clone();
        newPoints.translate(new paper.Point(colOffset * c, rowOffset * r));

        if (mirrorX && c % 2 == 1) {
          newPoints.scale(-1, 1);
        }

        if (mirrorY && r % 2 == 1) {
          newPoints.scale(1, -1);
        }

        newPoints.segments.forEach((s) => {
          seedPoints2.push([s.point.x, s.point.y]);
        });
      }
    }

    return seedPoints2;
  }

  makeDesign(paper: paper.PaperScope, params: any) {
    const {
      numPoints = 100,
      rows = 1,
      cols = 1,
      numBorderPoints = 0,
      mirrorX = false,
      mirrorY = false,
      removeEdgePolygons = false,
      borderSize = 0,
      pointStrategy = "random",
      sunflowerAngle,
      sunflowerScalingParam,
      overlapInterferencePercentage,
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
      mirrorX,
      mirrorY,
      pointStrategy,
      sunflowerAngle,
      sunflowerScalingParam,
      overlapInterferencePercentage,
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
        title: "MirrorX",
        value: true,
        name: "mirrorX",
      }),
      new OnOffMetaParameter({
        title: "MirrorY",
        value: true,
        name: "mirrorY",
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

      new RangeMetaParameter({
        title: "Overlap interference percentage",
        min: 0,
        max: 100,
        step: 0.5,
        value: 0,
        name: "overlapInterferencePercentage",
        // shouldDisplay: (params: any) => params.rows > 1 || params.height > 1
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
