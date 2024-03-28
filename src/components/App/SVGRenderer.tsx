import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import {
  makeSVGData,
  svgStringHydrator,
} from "../../bracelet-maker/utils/svg-utils";
import DownloadButtons from "./DownloadButtons";

export function SVGRenderer({
  currentModel,
  paper,
  modelParams,
  modelMaker,
}: {
  paper: paper.PaperScope;
  currentModel: CompletedModel | null | undefined;
  modelParams: any;
  modelMaker: OuterPaperModelMaker;
}) {
  if (!currentModel) {
    return "Error rendering model";
  }

  const outerStyle: Partial<paper.Style> = {
    strokeColor: "red",
    strokeWidth: 0.005,
    fillColor: "lightslategrey",
    fillRule: "evenodd",
  };

  const compoundPath =
    currentModel.outer instanceof paper.CompoundPath
      ? currentModel.outer
      : new paper.CompoundPath({
          children: [currentModel.outer],
        });

  compoundPath.style = outerStyle;
  paper.project.activeLayer.addChild(compoundPath);

  [...currentModel.holes, ...currentModel.design].forEach((hole) => {
    hole.strokeColor = "red";
    hole.strokeWidth = 0.005;
    hole.fillColor = "white";
    paper.project.activeLayer.addChild(hole);
  });

  _.forEach(getDebugLayers(), (v: paper.Group, _k: string) => {
    if (v.visible) {
      paper.project.activeLayer.addChild(v);
    }
  });

  const svgData = makeSVGData({
    paper,
    toExport: paper.project,
    shouldClean: false,
    elHydrator: svgStringHydrator,
    modelParams,
  });

  return (
    <div id="previewArea">
      <div
        id="svgArea"
        style={{
          justifyContent: "center",
          display: "flex",
        }}
        dangerouslySetInnerHTML={{ __html: svgData }}
      />
      <DownloadButtons
        modelMaker={modelMaker}
        params={modelParams}
        paper={paper}
      />
    </div>
  );
}
