import * as potrace from "potrace";

import { displayDataUriImageToConsole } from "./debug-utils";

export async function traceFromBufferToSvgString({
  buffer,
  options,
}: {
  buffer: Buffer;
  options?: potrace.PotraceOptions;
}): Promise<string> {
  const trace = new potrace.Potrace(options);

  return await new Promise((resolve, reject) => {
    trace.loadImage(buffer, function (err) {
      if (err) {
        console.log("error", err);
        reject({ paths: [] });
      }
      const svg = trace.getSVG();
      resolve(svg);
    });
  });
}

export async function reTracePaperPath({
  paper,
  item: originalItem,
  options,
}: {
  paper: paper.PaperScope;
  item: paper.Item;
  options?: potrace.PotraceOptions;
}) {
  const item = originalItem.clone();
  item.style = {
    fillColor: "black",
  };

  const raster = item.rasterize({
    resolution: 10000,
  });
  const dataUri = raster.toDataURL();
  displayDataUriImageToConsole(dataUri);

  const base64data = dataUri.split(",")[1];
  const buffer = Buffer.from(base64data, "base64");

  const tracedSvgString = await traceFromBufferToSvgString({ buffer, options });
  const tracedItemGroup = paper.project.importSVG(tracedSvgString, {
    expandShapes: true,
  });

  // Get the biggest item out of the group
  let tracedItem: paper.Item;
  tracedItemGroup.children.forEach((child) => {
    if (child instanceof paper.Shape) {
      return;
    }
    if (!tracedItem) {
      console.log("assinging first");
      tracedItem = child;
    } else {
      if (child.bounds.area > tracedItem.bounds.area) {
        tracedItem = child;
      }
    }
  });

  if (!tracedItem) {
    throw new Error("couldn't retrace path");
  }

  console.log({ tracedItem });

  tracedItem.bounds.center = item.bounds.center;

  tracedItem.scale(
    item.bounds.width / tracedItem.bounds.width,
    item.bounds.height / tracedItem.bounds.height
  );

  console.log(item.bounds, tracedItem.bounds);

  return tracedItem;
  // svgStringToPaper({ paper, svg: tracedSvgString, scale: 1 });
}
