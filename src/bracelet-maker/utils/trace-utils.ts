import configure from "@jimp/custom";
import threshold from "@jimp/plugin-threshold";
import JimpImport from "jimp/es";

import {
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../meta-parameter";
import { addToDebugLayer } from "./debug-layers";
import { displayDataUriImageToConsole } from "./debug-utils";
import { ImageDownloader } from "./image-downloader";
import { flattenArrayOfPathItems } from "./paperjs-utils";
import { traceFromBufferToSvgString } from "./potrace-utils";
const Jimp = configure({ plugins: [threshold] }, JimpImport);

type TraceReturn = {
  paths: paper.Path[];
  item?: paper.Item;
};
const cache: Record<string, TraceReturn> = {};

export async function downloadAndTraceImage(
  paper: paper.PaperScope,
  params: {
    bounds: paper.Rectangle;
    url: string;
    threshold: number;
    turnPolicy: string;
    turdSize: number;
    objectFit: string;
    scale: number;
    smooth: boolean;
    simplificationTolerance: number;
    contrastThresholdMax: number;
    blackOnWhite: boolean;
  }
): Promise<TraceReturn> {
  // create custom cachKey with custom stringify for bounds field
  const cacheKey = JSON.stringify({
    ...params,
    bounds: {
      x: params.bounds.x,
      y: params.bounds.y,
      width: params.bounds.width,
      height: params.bounds.height,
    },
  });

  if (cache[cacheKey]) {
    console.log("have cache for this!");
    return cache[cacheKey];
  }

  const {
    bounds,
    threshold,
    turnPolicy,
    turdSize,
    objectFit,
    scale,
    smooth,
    simplificationTolerance,
    url,
    contrastThresholdMax,
    blackOnWhite,
  } = params;

  if (url === "") {
    return { paths: [] };
  }

  async function getBuffer() {
    if (url.startsWith("data")) {
      // data:image/jpeg;base64,/9j/4AAQSkZJR
      const parts = url.split(",");
      return Buffer.from(parts[1], "base64");
    }

    try {
      return await ImageDownloader.fetch(url);
    } catch {
      return;
    }
  }

  const buffer = await getBuffer();
  if (!buffer) {
    return { paths: [], item: undefined };
  }

  const image = await Jimp.read(buffer);

  // Convert the image to black and white
  image.threshold({
    max: contrastThresholdMax,
    replace: 255,
    autoGreyscale: true,
  });

  // Get the buffer of the modified image
  const newBuffer = await image.getBufferAsync("image/png");

  // if (typeof window !== "undefined") {
  //   const imgEl = document.createElement("img");
  //   imgEl.src = URL.createObjectURL(new Blob([newBuffer]));
  //   document.body.appendChild(imgEl);
  // }
  console.log("thresholding image");
  displayDataUriImageToConsole(newBuffer);

  const tracedSvgString = await traceFromBufferToSvgString({
    buffer: newBuffer,
    options: {
      blackOnWhite,
      threshold,
      turnPolicy,
      turdSize,
    },
  });

  const item = paper.project.importSVG(tracedSvgString, {
    expandShapes: true,
  });

  addToDebugLayer(paper, "imageTrace", item.clone());
  // removeSharpAngles({ item });
  // addToDebugLayer(paper,  "postSharpRemoval", item.clone());

  // getOnlyCounterclockwisePaths({ paper, paths: [item] });

  item.remove();
  item.translate(
    new paper.Point(-item.bounds.width / 2, -item.bounds.height / 2)
  );

  item.children.forEach((child) => {
    if (child instanceof paper.Shape) {
      // console.log("child is a shape!!!");
      child.remove();
    }
  });

  console.log(bounds.width, item.bounds.width);
  const scaleW = (bounds.width / item.bounds.width) * scale;
  const scaleH = (bounds.height / item.bounds.height) * scale;

  console.log(`scaling to ${scaleW}, ${scaleH}`);

  if (objectFit === "contain" || objectFit === "contain-fill") {
    item.scale(scaleW > scaleH ? scaleH : scaleW, bounds.center);
  } else if (objectFit === "cover") {
    item.scale(scaleW > scaleH ? scaleW : scaleH, bounds.center);
  } else if (objectFit === "fill") {
    item.scale(scaleW, scaleH, bounds.center);
  }

  const paths: paper.Path[] = flattenArrayOfPathItems(paper, item.children);

  paths.forEach((path) => {
    path.closePath();

    // console.log(path.hasChildren());
    if (path instanceof paper.CompoundPath) {
      // console.log("this one is a path!");
    }

    if (simplificationTolerance > 0) {
      path.flatten(simplificationTolerance / 500);
    }

    // path.simplify(0.00005);

    if (smooth) {
      path.smooth({ type: "continuous" });
    }
  });

  cache[cacheKey] = { item: item.clone(), paths: paths.map((p) => p.clone()) };

  return { item, paths };
}

export function makeImageTraceMetaParameters(defaultUrl?: string) {
  return [
    new StringMetaParameter({
      title: "URL to image",
      value:
        defaultUrl ??
        "https://uploads2.wikiart.org/images/princess-fahrelnissa-zeid/untitled-1950-1.jpg",
      defaults: [
        defaultUrl ??
          "https://uploads2.wikiart.org/images/princess-fahrelnissa-zeid/untitled-1950-1.jpg",
      ],
      name: "url",
    }),
    new SelectMetaParameter({
      title: "Object Fit",
      value: "cover",
      options: ["contain", "cover", "fill", "contain-fill"],
      name: "objectFit",
    }),
    new RangeMetaParameter({
      title: "Border Size (in)",
      min: 0.02,
      max: 0.75,
      value: 0.04,
      step: 0.01,
      name: "bufferWidth",
    }),
    new RangeMetaParameter({
      title: "Threshold",
      min: -1,
      max: 255,
      value: -1,
      step: 1,
      name: "threshold",
    }),
    new RangeMetaParameter({
      title: "turdSize",
      min: 0,
      max: 200,
      value: 2,
      step: 1,
      name: "turdSize",
    }),
    new SelectMetaParameter({
      title: "Turn Policy",
      options: ["minority", "majority", "black", "white", "left", "right"],
      value: "minority",
      name: "turnPolicy",
    }),
    new RangeMetaParameter({
      title: "scale",
      min: 0,
      max: 100,
      value: 1,
      step: 0.1,
      name: "scale",
    }),
    new OnOffMetaParameter({
      title: "Smooth blobs",
      value: false,
      name: "smooth",
    }),
    new OnOffMetaParameter({
      title: "blackOnWhite",
      value: false,
      name: "blackOnWhite",
    }),
    new OnOffMetaParameter({
      title: "repeat",
      value: false,
      name: "repeat",
    }),
    new RangeMetaParameter({
      title: "Simplification Tolerance",
      min: 0,
      max: 1000,
      value: 10,
      step: 1,
      name: "simplificationTolerance",
    }),

    new RangeMetaParameter({
      title: "Contrast Max",
      min: 0,
      max: 256,
      value: 100,
      step: 1,
      name: "contrastThresholdMax",
    }),
  ];
}
