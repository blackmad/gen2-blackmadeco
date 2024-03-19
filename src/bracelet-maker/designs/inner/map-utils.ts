import { VectorTile } from "@mapbox/vector-tile";
import * as _ from "lodash";
import Pbf from "pbf";
const { fetch } = require("fetch-ponyfill")();

export function lng2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
export function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

export function tile2lng(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

export function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export interface MapExtent {
  minlat: number;
  minlng: number;
  maxlat: number;
  maxlng: number;
  zoom: number;
}

type TileCoords = {
  x: number;
  y: number;
  z: number;
};

export function getTileCoords(params: MapExtent): TileCoords[] {
  const { minlat, minlng, maxlat, maxlng, zoom } = params;
  const x1 = lat2tile(minlat, zoom); // eg.lat2tile(34.422, 9);
  const y1 = lng2tile(minlng, zoom);
  const x2 = lat2tile(maxlat, zoom);
  const y2 = lng2tile(maxlng, zoom);

  const tiles: TileCoords[] = [];
  // This is going to have some hilarious edge cases crossing the edge of mercator, but
  // ... I don't care
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  return tiles;
}

// export function fetchTopoJsonTile(path: string): Promise<Response> {
//   const url = `https://a.tile.nextzen.org/tilezen/vector/v1/512/all/${path}.topojson?api_key=x_E7exs2TOm0lNb-raBgLA&`;
//   const myHeaders = new Headers();
//   if (!window) {
//     myHeaders.set("origin", "http://localhost:8080");
//   }
//   const myRequest = new Request(url, {
//     method: "GET",
//     headers: myHeaders,
//     mode: "cors",
//     cache: "default",
//   });
//   return fetch(myRequest);
// }

export async function fetchVectorTile(tileCoords: TileCoords): VectorTile {
  const { z, x, y } = tileCoords;
  const url = `https://tiles.stadiamaps.com/data/openmaptiles/${z}/${y}/${x}.pbf?api_key=ba2603de-0143-4fcd-b2cd-184aa40fe987`;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const pbf = new Pbf(new Uint8Array(arrayBuffer));
  const tile = new VectorTile(pbf);
  return tile;
}

export async function fetchGeoJsonTiles(extent: MapExtent) {
  const coords = getTileCoords(extent);

  const fetchers = coords.map(async (coord) => {
    const { x, y, z } = coord;
    const tile = await fetchVectorTile(coord);
    const features = [];

    const layer = tile.layers["transportation"];

    if (!layer) {
      return [];
    }

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      const geojson = feature.toGeoJSON(y, x, z);

      features.push(geojson);
    }

    return features;
  });

  const allFeatures = await Promise.all(fetchers);
  return _.flatten(allFeatures);
}

export function lineStringCoordinatesToPaperLine(
  paper: paper.PaperScope,
  coordinates: number[][],
  invertLatLng: boolean
): paper.Point[] {
  return coordinates.map((point) => {
    const p = invertLatLng
      ? new paper.Point(point[1], point[0])
      : new paper.Point(point[0], point[1]);
    return p;
  });
}

export function multiLneStringCoordinatesToPaperLines(
  paper: paper.PaperScope,
  coordinates: number[][][],
  invertLatLng: boolean
): paper.Point[][] {
  return coordinates.map((g) =>
    lineStringCoordinatesToPaperLine(paper, g, invertLatLng)
  );
}
