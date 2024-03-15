import * as topojson from "topojson-client";
import * as _ from 'lodash';
const {fetch, Request, Response, Headers} = require('fetch-ponyfill')();

export function lng2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
export function lat2tile(lat, zoom) {
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

export function tile2lng(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

export function tile2lat(y, z) {
  var n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export interface MapExtent {
    minlat: number;
    minlng: number;
    maxlat: number;
    maxlng: number;
    zoom: number;
}

export function getTilePaths(params: MapExtent): string[] {
  const {minlat, minlng, maxlat, maxlng, zoom} = params;
  var x1 = lat2tile(minlat, zoom); // eg.lat2tile(34.422, 9);
  var y1 = lng2tile(minlng, zoom);
  var x2 = lat2tile(maxlat, zoom);
  var y2 = lng2tile(maxlng, zoom);

  const tiles = [];
  // This is going to have some hilarious edge cases crossing the edge of mercator, but
  // ... I don't care
  for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      tiles.push(`${zoom}/${y}/${x}`);
    }
  }

  return tiles;
}

export function fetchTopoJsonTile(path: string): Promise<Response> {
  const url = `https://a.tile.nextzen.org/tilezen/vector/v1/512/all/${path}.topojson?api_key=x_E7exs2TOm0lNb-raBgLA&`;
  const myHeaders = new Headers();
  if (!window) {
    myHeaders.set('origin', 'http://localhost:8080');
  }
  const myRequest = new Request(url, {
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    cache: 'default',
  });
  return fetch(myRequest);
}

export async function fetchTopoJsonTiles(extent: MapExtent) {
  const paths = getTilePaths(extent);
  // console.log(paths);

  const fetchers = paths.map(async (path) => {
    const response = await fetchTopoJsonTile(path);
    const json = await response.json();
    
    // @ts-ignore
    const featureCollection = topojson.feature(json, 'roads');
    // console.log(topojson.feature(json, 'water'));
    return (featureCollection as any).features;
  });

  const allFeatures = await Promise.all(fetchers);
  return _.flatten(allFeatures);
}

export function lineStringCoordinatesToPaperLine(
  paper: paper.PaperScope,
  coordinates: number[][],
  invertLatLng: boolean
): paper.Point[] {
  return coordinates.map(point => {
    const p = invertLatLng
      ? new paper.Point(point[1], point[0])
      : new paper.Point(point[0], point[1]);
    return p;
  });
}

export function multiLneStringCoordinatesToPaperLines(
  paper: paper.PaperScope,
  coordinates: number[][][], invertLatLng: boolean
): paper.Point[][] {
  return coordinates.map(g => lineStringCoordinatesToPaperLine(paper, g, invertLatLng));
}