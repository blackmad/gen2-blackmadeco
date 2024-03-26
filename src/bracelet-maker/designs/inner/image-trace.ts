import { PaperOffset } from "paperjs-offset";

import {
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  bufferPointstoPathItem,
  getEvenlySpacePointsAlongPath,
} from "../../utils/paperjs-utils";
import { downloadAndTraceImage } from "../../utils/trace-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignImageTrace extends FastAbstractInnerDesign {
  allowOutline = false;
  needSubtraction = true;
  canKaleido = true;

  async makeDesign(paper: paper.PaperScope, params: any) {
    const {
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
      repeatPadding,
      shrinkBy,
    } = params;

    const boundaryModel: paper.Path = params.boundaryModel;

    let { paths, item } = await downloadAndTraceImage({
      paper,
      bounds: boundaryModel.bounds,
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
    });

    if (!item) {
      return { paths: [] };
    }

    if (shrinkBy > 0) {
      paths = paths.map((path) => {
        path.closePath();
        path.flatten(0.001);
        path.closePath();

        const offsetPath = PaperOffset.offset(path, -shrinkBy);
        // console.log(offsetPath.bounds.area);
        if (offsetPath.bounds.area === 0) {
          // Get approx outline points
          const points = getEvenlySpacePointsAlongPath({
            path: path,
            numPoints: 100,
          });

          const newOffsetPath = bufferPointstoPathItem(
            paper,
            -shrinkBy,
            points
          );
          // console.log(newOffsetPath.bounds.area / path.bounds.area);
          if (newOffsetPath.bounds.area / path.bounds.area < 0.2) {
            // path.flatten(0.1);
            // console.log({ path });
            // console.log(path.exportSVG());
            return path;
          }
          return newOffsetPath;
        }
        return offsetPath;
      });
    }

    // console.log({ paths });

    if (objectFit === "contain-fill") {
      item.translate([-item.bounds.x, -item.bounds.y]);

      const effectiveItemWidth = repeatPadding + item.bounds.width;
      const xRepeats = Math.ceil(
        boundaryModel.bounds.width / effectiveItemWidth
      );
      const xOffset =
        (boundaryModel.bounds.width +
          effectiveItemWidth / 2 -
          xRepeats * effectiveItemWidth) /
        2;

      const yRepeats = Math.ceil(
        boundaryModel.bounds.height / item.bounds.height
      );
      const yOffset =
        (boundaryModel.bounds.height - yRepeats * item.bounds.height) / 2;

      console.log({ xRepeats, yRepeats, xOffset, yOffset });

      const newPaths = [];
      for (let x = 0; x < xRepeats + 1; x++) {
        for (let y = 0; y < yRepeats; y++) {
          paths.forEach((path) => {
            const newPath = path.clone();
            newPath.translate(
              new paper.Point(
                boundaryModel.bounds.x + x * effectiveItemWidth + xOffset,
                boundaryModel.bounds.y + y * item.bounds.height + yOffset
              )
            );
            newPaths.push(newPath);
            addToDebugLayer(paper, "imageTrace", newPath);
            addToDebugLayer(paper, "imageTrace", newPath.bounds);
            // console.log(newPath.bounds);
          });
        }
      }
      return { paths: newPaths };
    }

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
      new RangeMetaParameter({
        title: "Repeat Padding",
        min: 0,
        max: 10,
        value: 0.1,
        step: 0.01,
        name: "repeatPadding",
      }),
      new RangeMetaParameter({
        title: "Shrink holes by",
        min: 0,
        max: 10,
        value: 0,
        step: 0.01,
        name: "shrinkBy",
      }),
    ];
  }
}
