import { displayDataUriImageToConsole } from "../../utils/debug-utils";
import { getEvenlySpacePointsAlongPath } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignSacredGeometry extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const boundaryModel: paper.Path = params.boundaryModel;

    const points = getEvenlySpacePointsAlongPath({
      path: boundaryModel,
      numPoints: 10,
    });

    const lines: paper.Path.Line[] = [];
    points.forEach((p1, i) => {
      points.slice(i + 1).forEach((p2, j) => {
        const line = new paper.Path.Line(p1, p2);
        line.strokeWidth = 0.03;
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

    const box = new paper.Path.Rectangle(
      new paper.Rectangle(
        0,
        0,
        boundaryModel.bounds.width,
        boundaryModel.bounds.height
      )
    );
    box.strokeColor = "black";
    box.strokeWidth = 0.03;
    box.fillColor = "red";

    const raster = box.rasterize();
    displayDataUriImageToConsole(raster.toDataURL());

    console.log(raster.toDataURL());

    return { paths: [box] };
  }

  get designMetaParameters() {
    return [];
  }
}
