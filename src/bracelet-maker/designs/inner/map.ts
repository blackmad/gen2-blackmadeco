// TODO: if it's too close to another street, don't use it

import {
  GeocodeMetaParameter,
  MetaParameter,
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
} from "../../meta-parameter";
import { cascadedUnion } from "../../utils/cascaded-union";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  bufferLine,
  flattenArrayOfPathItems,
  simplifyPath,
} from "../../utils/paperjs-utils";
import { DefaultDict, isNonNullable } from "../../utils/type-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";
import {
  fetchGeoJsonTiles,
  lineStringCoordinatesToPaperLine,
  multiLneStringCoordinatesToPaperLines,
} from "./map-utils";

export class InnerDesignMap extends FastAbstractInnerDesign {
  needSubtraction = false;
  needSeed = false;
  canKaleido = true;
  defaultKaleido = false;
  canRound = true;
  allowOutline = true;

  get metaParameters() {
    // TODO: fix the can't call parent
    const metaParams: MetaParameter<any>[] = super.metaParameters;
    const shouldSmooth = metaParams.find((p) => p.name === "shouldSmooth");
    if (shouldSmooth) {
      shouldSmooth.value = false;
    }
    return metaParams;
  }

  extractPointPathsFromFeatures(
    paper: paper.PaperScope,
    features: GeoJSON.Feature[],
    invertLatLng: boolean
  ): paper.Point[][] {
    const paths: paper.Point[][] = [];
    features.map((f) => {
      if (f.geometry.type === "LineString") {
        paths.push(
          lineStringCoordinatesToPaperLine(
            paper,
            f.geometry.coordinates,
            invertLatLng
          )
        );
      } else if (f.geometry.type === "MultiLineString") {
        multiLneStringCoordinatesToPaperLines(
          paper,
          f.geometry.coordinates,
          invertLatLng
        ).forEach((l) => paths.push(l));
      } else {
        console.log(`cannot understand ${f.geometry.type}`);
      }
    });
    return paths;
  }

  filterFeatures(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
    const classDict = new DefaultDict(0);
    const subClassDict = new DefaultDict(0);

    features.forEach((f) => {
      classDict[f["properties"]["class"]]++;
      subClassDict[f["properties"]["subclass"]]++;
    });

    // console.table(classDict, { depth: null });
    // console.table(subClassDict, { depth: null });

    const allowedClasses = [
      "minor",
      "path",
      "primary",
      "secondary",
      "service",
      "tertiary",
      "bridge",
      "minor_construction",
    ];

    const disallowedSubClasses = [
      "crossing",
      "cycleway",
      "path",
      "pedestrian",
      "platform",
      "rail",
      "sidewalk",
      "steps",
      "subway",
    ];

    const filteredFeatures = features.filter((f) => {
      return (
        f["geometry"]["type"] !== "Polygon" &&
        f["geometry"]["type"] !== "MultiPolygon" &&
        allowedClasses.includes(f["properties"]["class"]) &&
        !disallowedSubClasses.includes(f["properties"]["subclass"])
      );
      // return true;

      // ["road", "major_road", "minor_road"].includes(f.properties?.kind) &&
      // f.properties?.kind_detail != "service" // these seem to very often be parking lot outlines;
      // these are cool but break parks
      // (f.properties.kind == "path" && f.properties.kind_detail == "footway")
    });

    const classDict2 = new DefaultDict(0);
    const subClassDict2 = new DefaultDict(0);

    filteredFeatures.forEach((f) => {
      classDict2[f["properties"]["class"]]++;
      subClassDict2[f["properties"]["subclass"]]++;
    });

    // console.table(classDict2, { depth: null });
    // console.table(subClassDict2, { depth: null });

    return filteredFeatures;
  }

  async makeDesign(paper: paper.PaperScope, params: any) {
    const { center, scaleX, xyRatio, invertLatLng, lineWidth, debug } = params;

    const boundaryModel = params.boundaryModel.clone();

    const centerLat = parseFloat(center.split(",")[0]);
    const centerLng = parseFloat(center.split(",")[1]);

    const centerX = invertLatLng ? centerLat : centerLng;
    const centerY = invertLatLng ? centerLng : centerLat;

    // if scaleX=500, we're saying 1 degree of latitude = 500 inches
    // so to fill boundaryModel.width, we need width/scaleX latitude total

    const scaleY = scaleX / xyRatio;

    const latSpan = invertLatLng
      ? boundaryModel.bounds.width / scaleX
      : boundaryModel.bounds.height / scaleY;
    const lngSpan = invertLatLng
      ? boundaryModel.bounds.height / scaleY
      : boundaryModel.bounds.width / scaleX;

    let zoom = 14;
    if (scaleX < 200 || scaleY < 200) {
      zoom = 13;
    }

    const features = await fetchGeoJsonTiles({
      minlat: centerLat - latSpan / 2,
      minlng: centerLng - lngSpan / 2,
      maxlat: centerLat + latSpan / 2,
      maxlng: centerLng + lngSpan / 2,
      zoom,
    });

    console.log({ features });
    const filteredFeatures = this.filterFeatures(features);
    console.log({ filteredFeatures });
    const pointPaths: paper.Point[][] = this.extractPointPathsFromFeatures(
      paper,
      filteredFeatures,
      invertLatLng
    );
    console.log({ pointPaths });
    const bufferedPaths: paper.PathItem[] = pointPaths
      .map((path) => {
        const centerAt = (function (centerAt) {
          switch (centerAt) {
            case "topLeft":
              return boundaryModel.bounds.topLeft;
            case "bottomLeft":
              return boundaryModel.bounds.bottomLeft;
            case "center":
              return boundaryModel.bounds.center;
          }
        })(params.centerAt);

        // translate map coordinates to our coordinate system, center on our center and scale
        const points = path.map((point) => {
          return new paper.Point(
            (point.x - centerX) * scaleX,
            // make this second one negative so north is "up" in our coordinate system
            (point.y - centerY) * -scaleY
          ).add(centerAt);
        });

        const line = new paper.Path(points);

        if (debug) {
          addToDebugLayer(paper, "lines", line);
        }

        // Only consider line segments that are inside or touching our boundaries
        const shrunkBondaryModel = boundaryModel.clone();
        shrunkBondaryModel.scale(0.99);
        if (
          line.isInside(boundaryModel.bounds) ||
          shrunkBondaryModel.intersects(line)
        ) {
          const fatLine = bufferLine(paper, points, lineWidth);
          if (fatLine) {
            return fatLine.intersect(boundaryModel);
          } else {
            return null;
          }
        }
      })
      .filter(isNonNullable);

    // Now union all the buffered lines together
    const unionedPaths = cascadedUnion(bufferedPaths.filter((b) => b != null));
    // Explode all the compound paths because that way we can isolate the ones that touch the edge
    const explodedUnionedPaths = flattenArrayOfPathItems(paper, unionedPaths);

    const simplifiedPaths = explodedUnionedPaths.map((path) =>
      simplifyPath(paper, path, 0.05)
    );

    // After unioning, we end up with a set of cuts that will cause the inside of the design to drop out,
    // so we carefully invert it ...
    // find the inside paths, these are good holes
    const insidePaths = simplifiedPaths.filter((p) =>
      p.isInside(boundaryModel.bounds)
    );
    // find the paths that touch the edge
    const outsidePaths = explodedUnionedPaths.filter(
      (p) => !p.isInside(boundaryModel.bounds)
    );
    // Invert those
    let invertedPath = boundaryModel;
    outsidePaths.forEach(
      (path) => (invertedPath = invertedPath.subtract(path))
    );

    const ret = [invertedPath, ...insidePaths];

    return { paths: ret };
  }

  get designMetaParameters() {
    return [
      new GeocodeMetaParameter({
        title: "Center",
        text: "111 8th avenue, nyc",
        value: "40.74,-74",
        name: "center",
      }),
      new RangeMetaParameter({
        title: "Scale X",
        min: 200,
        max: 1000,
        value: 500,
        step: 1,
        name: "scaleX",
      }),
      new RangeMetaParameter({
        title: "X/Y ratio",
        min: 0.0001,
        max: 10,
        value: 1.0,
        step: 0.001,
        name: "xyRatio",
      }),
      new RangeMetaParameter({
        title: "Line Width",
        min: 0.02,
        max: 0.5,
        value: 0.1,
        step: 0.001,
        name: "lineWidth",
      }),
      new OnOffMetaParameter({
        title: "Invert Lat/Lng",
        value: false,
        name: "invertLatLng",
      }),
      new SelectMetaParameter({
        title: "Center At",
        options: ["topLeft", "bottomLeft", "center"],
        value: "center",
        name: "centerAt",
        help: "bottomLeft is probably what you want for kaleido mode",
      }),
    ];
  }
}
