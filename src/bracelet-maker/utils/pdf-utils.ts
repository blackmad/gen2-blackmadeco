import blobStream from "blob-stream";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

import { OuterPaperModelMaker } from "../model-maker";
import { makeFilename, sendFileToUser } from "./download-utils";

// Pretty sure this whole makeSVGData thing is here so that we can inject a different svg
// hydrator when not in a browser?
export function downloadPDFHelper({
  svg,
  paper,
  params,
  modelMaker,
}: {
  svg: string | SVGElement;
  paper: paper.PaperScope;
  modelMaker: OuterPaperModelMaker;
  params: any;
}) {
  const widthInches = paper.project.activeLayer.bounds.width;
  const heightInches = paper.project.activeLayer.bounds.height;

  const doc = new PDFDocument({
    compress: false,
    size: [widthInches * 72, heightInches * 72],
  });

  SVGtoPDF(doc, svg, 0, 0);

  function blobToDataURL(
    blob: Blob,
    callback: (s: string | ArrayBuffer | null) => void
  ) {
    const a = new FileReader();

    a.onload = function (e) {
      callback(e?.target?.result ?? null);
    };
    a.readAsDataURL(blob);
  }

  const filename = makeFilename({
    extension: "pdf",
    modelMaker,
    params,
  });

  const stream = doc.pipe(blobStream());
  stream.on("finish", function () {
    const blob = stream.toBlob("application/pdf");
    blobToDataURL(blob, (dataUri) => {
      if (!dataUri) {
        throw new Error("No dataUri");
      }
      if (dataUri instanceof ArrayBuffer) {
        throw new Error("dataUri is ArrayBuffer");
      }
      sendFileToUser({ dataUri, filename });
    });
  });
  doc.end();
}

// export function downloadOutlinePDF({
//   paper,
//   completedModel,
// }: {
//   paper: paper.PaperScope;
//   completedModel: CompletedModel;
// }) {
//   downloadPDFHelper(() => {
//     const wholeDesign = makeSVGData(
//       paper,
//       paper.project,
//       true,
//       svgStringHydrator
//     );

//     const tmpOuter = new paper.CompoundPath({
//       children: [completedModel.outer, ...completedModel.holes],
//       strokeColor: "red",
//       strokeWidth: "0.005",
//       fillColor: "lightgrey",
//       fillRule: "evenodd",
//     });

//     const outerDesignOnly = makeSVGData(
//       paper,
//       tmpOuter,
//       true,
//       svgStringHydrator
//     );

//     // TODO: remember why we do this
//     const $wholeDesign = $(wholeDesign);
//     $wholeDesign.empty();
//     $wholeDesign.append($(outerDesignOnly));
//     return $wholeDesign[0].outerHTML;
//   });
// }
