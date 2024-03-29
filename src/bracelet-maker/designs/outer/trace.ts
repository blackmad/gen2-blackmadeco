import { MetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import {
  downloadAndTraceImage,
  makeImageTraceMetaParameters,
} from "../../utils/trace-utils";
import { AbstractPathOuter } from "./abstract-path-outer";

export class TraceOuter extends AbstractPathOuter {
  public get outerMetaParameters(): MetaParameter<any>[] {
    return [
      ...super.abstractPathOuterMetaParameters({}),
      ...makeImageTraceMetaParameters(
        "https://www.pngitem.com/pimgs/m/172-1729815_moon-crescent-symbol-upward-crescent-moon-meaning-hd.png"
      ),
    ];
  }

  async makeOuterModel(
    paper: paper.PaperScope,
    params: any
  ): Promise<{ path: paper.PathItem; holes: paper.PathItem[] }> {
    const { height, width } = params;

    const { paths, item } = await downloadAndTraceImage(paper, {
      bounds: new paper.Rectangle(0, 0, height, width),
      ...params,
    });

    if (paths.length === 0 || !item) {
      return { path: new paper.Path(), holes: [] };
    }

    const biggestPath = paths.reduce((acc, path) => {
      return path.area < acc.area ? path : acc;
    });
    addToDebugLayer(paper, "biggestPath", biggestPath);

    return { path: biggestPath, holes: [] };
  }
}
