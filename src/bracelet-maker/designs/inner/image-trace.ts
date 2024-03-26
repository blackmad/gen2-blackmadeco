import { PaperOffset } from "paperjs-offset";

import { RangeMetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  bufferPointstoPathItem,
  getEvenlySpacePointsAlongPath,
} from "../../utils/paperjs-utils";
import {
  downloadAndTraceImage,
  makeImageTraceMetaParameters,
} from "../../utils/trace-utils";
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

    let { paths, item } = await downloadAndTraceImage(paper, {
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
      ...makeImageTraceMetaParameters(),
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
