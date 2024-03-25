import React from "react";

import { OuterPaperModelMaker } from "../../bracelet-maker/model-maker";
import {
  makeFilename,
  sendFileToUser,
} from "../../bracelet-maker/utils/download-utils";
import { downloadPDFHelper } from "../../bracelet-maker/utils/pdf-utils";
import {
  makeSVGData,
  svgStringHydrator,
} from "../../bracelet-maker/utils/svg-utils";

export default function DownloadButtons({
  paper,
  modelMaker,
  params,
}: {
  paper: paper.PaperScope;
  modelMaker: OuterPaperModelMaker;
  params: any;
}) {
  //   function downloadPDFHelper(designCallback) {
  //     const widthInches = paper.project.activeLayer.bounds.width;
  //     const heightInches = paper.project.activeLayer.bounds.height;

  //     // @ts-ignore
  //     const doc = new PDFDocument({
  //       compress: false,
  //       size: [widthInches * 72, heightInches * 72],
  //     });

  //     SVGtoPDF(doc, designCallback(), 0, 0);

  //     function blobToDataURL(blob, callback) {
  //       const a = new FileReader();

  //       a.onload = function (e) {
  //         // @ts-ignore
  //         callback(e.target.result);
  //       };
  //       a.readAsDataURL(blob);
  //     }

  //     const stream = doc.pipe(blobStream());
  //     const self = this;
  //     stream.on("finish", function () {
  //       const blob = stream.toBlob("application/pdf");
  //       blobToDataURL(blob, (s) => self.sendFileToUser(s, "pdf"));
  //     });
  //     doc.end();
  //   }

  function downloadPDF() {
    const svg = makeSVGData(
      paper,
      paper.project,
      true,
      svgStringHydrator,
      params
    );
    downloadPDFHelper({
      paper,
      modelMaker,
      params,
      svg,
    });
  }

  function downloadSVG() {
    const data = makeSVGData(
      paper,
      paper.project,
      true,
      svgStringHydrator,
      params
    );
    const mimeType = "image/svg+xml";
    const encoded = encodeURIComponent(data);
    const uriPrefix = "data:" + mimeType + ",";
    const dataUri = uriPrefix + encoded;

    const filename = makeFilename({ extension: "svg", modelMaker, params });
    sendFileToUser({ dataUri, filename });
  }

  return (
    <div id="topArea">
      <div id="downloadContainer" className="text-center">
        <button className="downloadButton downloadSVG" onClick={downloadSVG}>
          Download SVG
        </button>
        <button className="downloadButton downloadPDF" onClick={downloadPDF}>
          Download PDF
        </button>
        {/* <button
          className="downloadButton downloadOutlinePDF"
          onClick={downloadOutlinePDF}
        >
          Download Outline PDF
        </button> */}
        {/* <button
          className="downloadButton saveToMyLibrary"
          onClick={saveToMyLibrary}
        >
          Save
        </button> */}
      </div>
    </div>
  );
}
