import { VectorTile, VectorTileFeature } from "@mapbox/vector-tile";
import fetch from "node-fetch";
import Pbf from "pbf";

async function fetchTile(x, y, z) {
  const url = `https://tiles.stadiamaps.com/data/openmaptiles/${z}/${x}/${y}.pbf?api_key=ba2603de-0143-4fcd-b2cd-184aa40fe987`;
  // const rasterUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  // console.log({ rasterUrl });

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const pbf = new Pbf(new Uint8Array(arrayBuffer));
  const tile = new VectorTile(pbf);

  // console.log(Object.keys(tile.layers));
  const layerName = "transportation";

  const layer = tile.layers[layerName];
  for (let i = 0; i < layer.length; i++) {
    const feature: typeof VectorTileFeature = layer.feature(i);
    const geojson = feature.toGeoJSON(x, y, z);
  }
}

// Fetch a specific tile
fetchTile(4824, 6158, 14);
