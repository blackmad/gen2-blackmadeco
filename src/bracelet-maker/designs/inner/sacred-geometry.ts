import { addToDebugLayer } from "../../utils/debug-layers";
import { displayDataUriImageToConsole } from "../../utils/debug-utils";
import {
  flattenArrayOfPathItems,
  getEvenlySpacePointsAlongPath,
} from "../../utils/paperjs-utils";
import { traceFromBufferToSvgString } from "../../utils/potrace-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignSacredGeometry extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const boundaryModel: paper.Path = params.boundaryModel;

    // const points = getEvenlySpacePointsAlongPath({
    //   path: boundaryModel,
    //   numPoints: 15,
    // });

    let points = [];
    boundaryModel.segments.forEach((segment) => {
      const line = new paper.Path.Line(segment.previous.point, segment.point);
      line.scale(0.8);
      points = points.concat(
        getEvenlySpacePointsAlongPath({
          path: line,
          numPoints: 4,
        })
      );
      addToDebugLayer(paper, "shurnkLine", line);
    });

    const lines: paper.Path.Line[] = [];
    points.forEach((p1, i) => {
      addToDebugLayer(paper, "points", p1);

      points.slice(i + 1).forEach((p2, j) => {
        const line = new paper.Path.Line(p1, p2);
        line.strokeWidth = 0.001;
        line.strokeColor = "black";
        lines.push(line);
      });
    });

    // const box = new paper.Path.Rectangle(new paper.Rectangle(0, 0, 10, 10));
    // box.strokeColor = "black";
    // box.strokeWidth = 0.03;
    // box.fillColor = "red";
    // box.visible = true;
    // lines.push(box);

    // const totalScene = new paper.CompoundPath(lines);
    // const totalSceneRaster = box.rasterize();
    // displayDataUriImageToConsole(totalSceneRaster.toDataURL());

    // const box = new paper.Path.Rectangle(
    //   new paper.Rectangle(
    //     0,
    //     0,
    //     boundaryModel.bounds.width,
    //     boundaryModel.bounds.height
    //   )
    // );
    const box = new paper.Group(lines);
    console.log(box.bounds);
    box.strokeColor = "black";
    box.strokeWidth = 0.03;
    box.fillColor = "red";

    const raster = box.rasterize({
      resolution: 10000,
    });
    const dataUri = raster.toDataURL();
    displayDataUriImageToConsole(dataUri);

    const base64data = dataUri.split(",")[1];
    console.log(base64data);
    const buffer = Buffer.from(base64data, "base64");
    const tracedSvgString = await traceFromBufferToSvgString({
      buffer,
      options: { optCurve: false },
    });

    const item = paper.project.importSVG(tracedSvgString, {
      expandShapes: true,
    });
    item.scale(
      boundaryModel.bounds.width / item.bounds.width,
      boundaryModel.bounds.height / item.bounds.height,
      boundaryModel.bounds.topLeft
    );

    console.log({ item });

    addToDebugLayer(paper, "item", item);

    const paths = flattenArrayOfPathItems(paper, [item]);
    // Find the biggest area path and remove it
    const biggestPath = paths.reduce((acc, path) => {
      return path.area < acc.area ? path : acc;
    });
    paths.splice(paths.indexOf(biggestPath), 1);

    return { paths };
  }

  get designMetaParameters() {
    return [];
  }
}
