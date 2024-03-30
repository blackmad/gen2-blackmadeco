import { MetaParameter, SelectMetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { pathItemArea } from "../../utils/paperjs-utils";
import {
  downloadAndTraceImage,
  makeImageTraceMetaParameters,
} from "../../utils/trace-utils";
import { AbstractPathOuter } from "./abstract-path-outer";

export class InternalSvgOuter extends AbstractPathOuter {
  controlInfo = `
  // a cup should go to 4.41w, 7,42h
  // b cup 5.25w, 8.16h
  `;

  public get outerMetaParameters(): MetaParameter<any>[] {
    return [
      ...super.abstractPathOuterMetaParameters({}),
      ...makeImageTraceMetaParameters("/internal-images/Page 9.png").filter(
        (n) => n.name !== "url"
      ),
      new SelectMetaParameter({
        title: "Image",
        options: ["38brastrap.png", "a cup left.png", "b cup right.png"],
        value: "Page 9.png",
        name: "url",
      }),
    ];
  }

  removeDuplicateOverlappingPaths(paths: paper.PathItem[]): paper.PathItem[] {
    const uniquePaths = [];
    for (let i = 0; i < paths.length; i++) {
      let isUnique = true;
      for (let j = i + 1; j < paths.length; j++) {
        // if the centers are close
        const centerDistance = paths[i].position.getDistance(paths[j].position);
        const areaPercentageDifference =
          Math.abs(pathItemArea(paths[i]) - pathItemArea(paths[j])) /
          pathItemArea(paths[i]);

        if (centerDistance < 0.1 && areaPercentageDifference < 0.1) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        uniquePaths.push(paths[i]);
      }
    }
    return uniquePaths;
  }

  async makeOuterModel(
    paper: paper.PaperScope,
    params: any
  ): Promise<{ path: paper.PathItem; holes: paper.PathItem[] }> {
    const { height, width } = params;

    const { paths: nondedupedPaths, item } = await downloadAndTraceImage(
      paper,
      {
        bounds: new paper.Rectangle(0, 0, height, width),
        ...params,
        url: `/internal-images/${params.url}`,
      }
    );

    // const paths = nondedupedPaths;
    const paths = this.removeDuplicateOverlappingPaths(nondedupedPaths);

    if (paths.length === 0 || !item) {
      return { path: new paper.Path(), holes: [] };
    }

    const biggestPath = paths.reduce((acc, path) => {
      return path.area < acc.area ? path : acc;
    });
    const otherPaths = paths.filter((path) => path !== biggestPath);
    addToDebugLayer(paper, "biggestPath", biggestPath);

    addToDebugLayer(paper, "holes", otherPaths);

    return { path: biggestPath, holes: otherPaths };
  }
}
