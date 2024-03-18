import PDFDocument from "pdfkit";
import streamToBlob from "stream-to-blob";
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
  initPDF();

  const widthInches = paper.project.activeLayer.bounds.width;
  const heightInches = paper.project.activeLayer.bounds.height;

  const doc = new PDFDocument({
    compress: false,
    size: [widthInches * 72, heightInches * 72],
  });

  SVGtoPDF(doc, svg, 0, 0);

  const filename = makeFilename({
    extension: "pdf",
    modelMaker,
    params,
  });

  streamToBlob(doc, "application/pdf").then((blob) => {
    const reader = new FileReader();
    reader.onloadend = function () {
      const base64data = reader.result;
      console.log(base64data);
      if (typeof base64data !== "string") {
        throw new Error("base64data is not a string");
      }
      sendFileToUser({ dataUri: base64data, filename });
    };
    reader.readAsDataURL(blob);
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

/*** INIT PDF SECTION */
// the fs here is not node fs but the provided virtual one
import fs from "fs";

function initPDF() {
  function _registerBinaryFiles(ctx: __WebpackModuleApi.RequireContext) {
    ctx.keys().forEach((key) => {
      // extracts "./" from beginning of the key
      fs.writeFileSync(key.substring(2), ctx(key));
    });
  }

  function registerAFMFonts(ctx: __WebpackModuleApi.RequireContext) {
    ctx.keys().forEach((key) => {
      const match = key.match(/([^/]*\.afm$)/);
      if (match) {
        // afm files must be stored on data path
        fs.writeFileSync(`data/${match[0]}`, ctx(key));
      }
    });
  }

  // register AFM fonts distributed with pdfkit
  // is good practice to register only required fonts to avoid the bundle size increase too much
  registerAFMFonts(
    require.context("pdfkit/js/data", false, /Helvetica.*\.afm$/)
  );
}
