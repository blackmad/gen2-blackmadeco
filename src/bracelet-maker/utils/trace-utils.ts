import configure from "@jimp/custom";
import threshold from "@jimp/plugin-threshold";
import JimpImport from "jimp/es";

import { addToDebugLayer } from "./debug-layers";
import { displayDataUriImageToConsole } from "./debug-utils";
import { ImageDownloader } from "./image-downloader";
import { flattenArrayOfPathItems } from "./paperjs-utils";
import { traceFromBufferToSvgString } from "./potrace-utils";
const Jimp = configure({ plugins: [threshold] }, JimpImport);

export async function downloadAndTraceImage({
  paper,
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
}: {
  paper: paper.PaperScope;
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
}): Promise<{
  paths: paper.Path[];
  item?: paper.Item;
}> {
  if (url === "") {
    return { paths: [] };
  }

  async function getBuffer() {
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
    autoGreyscale: false,
  });

  // Get the buffer of the modified image
  const newBuffer = await image.getBufferAsync("image/png");

  // if (typeof window !== "undefined") {
  //   const imgEl = document.createElement("img");
  //   imgEl.src = URL.createObjectURL(new Blob([newBuffer]));
  //   document.body.appendChild(imgEl);
  // }

  displayDataUriImageToConsole(newBuffer.toString("base64"));

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

  return { item, paths };
}
