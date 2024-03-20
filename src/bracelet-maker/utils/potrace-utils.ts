import * as potrace from "potrace";

import { flattenArrayOfPathItems } from "./paperjs-utils";

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

export function svgStringToPaper({
  paper,
  svg,
  scale,
}: {
  paper: paper.PaperScope;
  svg: string;
  scale: number;
}) {
  const item = paper.project.importSVG(svg, { expandShapes: true });
  const paths: paper.Path[] = flattenArrayOfPathItems(paper, item.children);
  item.remove();
  item.translate(
    new paper.Point(-item.bounds.width / 2, -item.bounds.height / 2)
  );
  item.scale(1 / scale, boundaryModel.bounds.center);

  paths.forEach((path) => {
    path.closePath();

    if (smooth) {
      path.smooth({ type: "continuous" });
    }

    if (simplificationTolerance > 0) {
      path.simplify(simplificationTolerance / 50000);
    }
  });
}
