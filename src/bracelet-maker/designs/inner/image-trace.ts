// import "jimp";

import configure from "@jimp/custom";
import threshold from "@jimp/plugin-threshold";
import JimpImport from "jimp/es";

const Jimp = configure({ plugins: [threshold] }, JimpImport);

import {
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../../meta-parameter";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { traceFromBufferToSvgString } from "../../utils/potrace-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class ImageDownloaderImpl {
  lastUrl: string | null = null;
  lastBuffer: Buffer | null = null;

  async fetch(url: string): Promise<Buffer> {
    if (this.lastUrl === url && this.lastBuffer) {
      return this.lastBuffer;
    }

    const corsUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    const response = await fetch(corsUrl);
    this.lastBuffer = Buffer.from(await response.arrayBuffer());
    return this.lastBuffer;
  }
}

export const ImageDownloader = new ImageDownloaderImpl();

export class InnerDesignImageTrace extends FastAbstractInnerDesign {
  allowOutline = false;
  needSubtraction = true;
  canKaleido = true;

  async makeDesign(paper: paper.PaperScope, params: any) {
    const {
      boundaryModel,
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
      try {
        return await ImageDownloader.fetch(url);
      } catch {
        return;
      }
    }

    const buffer = await getBuffer();
    if (!buffer) {
      return { paths: [] };
    }

    console.log({ turnPolicy });

    const image = await Jimp.read(buffer);

    // Convert the image to black and white
    image.threshold({
      max: contrastThresholdMax,
      replace: 255,
      autoGreyscale: false,
    });

    // Get the buffer of the modified image
    const newBuffer = await image.getBufferAsync("image/png");
    console.log({ newBuffer });

    if (typeof window !== "undefined") {
      const imgEl = document.createElement("img");
      imgEl.src = URL.createObjectURL(new Blob([newBuffer]));
      document.body.appendChild(imgEl);
    }

    const tracedSvgString = await traceFromBufferToSvgString({
      buffer: newBuffer,
      options: {
        blackOnWhite,
        threshold,
        turnPolicy,
        turdSize,
      },
    });

    console.log({ tracedSvgString });

    const item = paper.project.importSVG(tracedSvgString, {
      expandShapes: true,
    });

    // console.log(item.children);

    // if (item.children) {
    //   const children = item.removeChildren();
    //   // paper.project.activeLayer.insertChildren(p.index, children);

    //   for (let n = 0; n < children.length; ++n) {
    //     const child = children[n];

    //     if (child instanceof paper.Path) {
    //       console.log(child);
    //       console.log(child.clockwise);
    //     }

    //     if (!child.clockwise) {
    //       child.fillColor = "red";
    //       child.selected = true;
    //       console.log("not clockwise");
    //     } else {
    //       console.log("clockwise");
    //     }
    //   }
    // }

    // item.removeChildren(0, 1);

    const paths: paper.Path[] = flattenArrayOfPathItems(paper, item.children);
    item.remove();
    item.translate(
      new paper.Point(-item.bounds.width / 2, -item.bounds.height / 2)
    );

    const scaleW = (boundaryModel.bounds.width / item.bounds.width) * scale;
    const scaleH = (boundaryModel.bounds.height / item.bounds.height) * scale;

    console.log(`scaling to ${scaleW}, ${scaleH}`);

    if (objectFit === "contain") {
      item.scale(
        scaleW > scaleH ? scaleH : scaleW,
        boundaryModel.bounds.center
      );
    } else if (objectFit === "cover") {
      item.scale(
        scaleW > scaleH ? scaleW : scaleH,
        boundaryModel.bounds.center
      );
    } else if (objectFit === "fill") {
      item.scale(scaleW, scaleH, boundaryModel.bounds.center);
    }

    paths.forEach((path) => {
      path.closePath();

      if (smooth) {
        path.smooth({ type: "continuous" });
      }

      if (simplificationTolerance > 0) {
        path.simplify(simplificationTolerance / 50000);
      }
    });

    console.log({ paths });

    return { paths };
  }

  get designMetaParameters() {
    return [
      new StringMetaParameter({
        title: "URL to image",
        value:
          "https://uploads2.wikiart.org/images/princess-fahrelnissa-zeid/untitled-1950-1.jpg",
        defaults: [
          "https://uploads2.wikiart.org/images/princess-fahrelnissa-zeid/untitled-1950-1.jpg",
        ],
        name: "url",
      }),
      new SelectMetaParameter({
        title: "Object Fit",
        value: "fit",
        options: ["contain", "cover", "fill"],
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
        value: 0.0,
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
}
