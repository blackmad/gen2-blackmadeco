import * as _ from "lodash";
import * as paper from "paper";
import { useCallback, useEffect, useState } from "react";

import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import {
  makeSVGData,
  svgStringHydrator,
} from "../../bracelet-maker/utils/svg-utils";
import { isNonNullable } from "../../bracelet-maker/utils/type-utils";
import { MetaParameterChange } from "../../meta-parameter-builder";
import DebugLayers from "./DebugLayers";
import DownloadButtons from "./DownloadButtons";
import { MetaParamsContainer } from "./MetaParamsContainer";

const Renderer = ({ modelMaker }: { modelMaker: OuterPaperModelMaker }) => {
  // const previewDiv = document.getElementById("previewArea");

  // $("body").addClass("loading");
  // $("body").removeClass("error");
  // $(".playArea").show();

  // rebuild params from X.a to {X: {a: }}
  // let modelParams = new Map<string, any>();
  // if (modelMaker.subModel) {
  //   _.each(this.params, (value, key) => {
  //     const parts = key.split(".");
  //     if (parts.length == 2) {
  //       modelParams[parts[0]] = modelParams[parts[0]] || {};
  //       modelParams[parts[0]][parts[1]] = value;
  //     } else {
  //       throw new Error("param does not have a dot: " + key);
  //     }
  //   });
  // } else {
  //   modelParams = new Map(this.params);
  // }

  // const canvas: HTMLCanvasElement = document.getElementById(
  //   "myCanvas"
  // ) as HTMLCanvasElement;
  paper.setup(null);
  paper.settings.insertItems = false;
  paper.activate();

  const [currentModel, setCurrentModel] = useState<CompletedModel | null>(null);
  const [modelParams, setModelParams] = useState<any>(null);

  useEffect(() => {
    if (modelMaker) {
      const initialOuterParams: Record<string, number | string> = {};

      modelMaker.outerMetaParameters.forEach((metaParam) => {
        initialOuterParams[metaParam.name] = metaParam.value;
      });

      const initialInnerParams: Record<string, number | string> = {};

      modelMaker.subModel.metaParameters.forEach((metaParam) => {
        initialInnerParams[metaParam.name] = metaParam.value;
      });

      const modelParams = {};
      modelParams[modelMaker.constructor.name] = initialOuterParams;
      modelParams[modelMaker.subModel.constructor.name] = initialInnerParams;
      console.log("setting model params", modelParams);

      setModelParams(modelParams);
    }
  }, [modelMaker]);

  const changeDesign = useCallback(() => {
    window.location.pathname = "/";
  }, []);

  const rerender = useCallback(() => {
    if (paper != null && paper.project != null) {
      paper.project.activeLayer.removeChildren();
      _.forEach(getDebugLayers(), (v: paper.Group, _k) => {
        v.removeChildren();
      });
    }

    console.log("model params now at hashParams", { modelParams });

    const hashParams = _.map(
      modelParams,
      (paramValue: any, paramName: string) => {
        console.log({ paramName });
        if (!paramName.includes(".")) {
          return;
        }
        console.log({ paramValue, paramName });
        return encodeURIComponent(`${paramName}=${paramValue}`);
      }
    )
      .filter(isNonNullable)
      .join("&");

    console.log({ hashParams });

    window.addEventListener("hashchange", (e) => {
      console.log({ e });
      e.stopPropagation();
      e.preventDefault();
    });

    // window.location.replace("#" + hashParams);
    history.replaceState(undefined, "", "#" + hashParams);

    modelMaker.make(paper, modelParams).then(setCurrentModel);
  }, [modelMaker, modelParams]);

  const changeCallback = useCallback(
    (change: MetaParameterChange) => {
      console.log({ value: change.value });
      const parts = change.metaParameter.name.split(".");
      modelParams[parts[0]][parts[1]] = change.value;
    },
    [modelParams]
  );

  useEffect(() => {
    if (!modelParams) {
      return;
    }
    rerender();
  }, [modelMaker, modelParams, rerender]);

  if (!currentModel) {
    return <div>Loading...</div>;
  }

  const compoundPath = new paper.CompoundPath({
    children: [
      currentModel.outer,
      ...currentModel.holes,
      ...currentModel.design,
    ],
    strokeColor: "red",
    strokeWidth: "0.005",
    fillColor: "lightgrey",
    fillRule: "evenodd",
  });

  paper.project.activeLayer.addChild(compoundPath);

  _.forEach(getDebugLayers(), (v: paper.Group, _k: string) => {
    if (v.visible) {
      paper.project.activeLayer.addChild(v);
    }
  });

  const svgData = makeSVGData(paper, paper.project, false, svgStringHydrator);

  return (
    <>
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
      <div>
        <MetaParamsContainer
          modelMaker={modelMaker}
          params={modelParams}
          onChange={changeCallback}
          rerenderCallback={rerender}
        />
        <DebugLayers onChange={rerender} />

        <div className="row justify-content-center">
          <button
            className="btn btn-primary m-1 changeDesign"
            onClick={changeDesign}
          >
            Change Design
          </button>
        </div>
      </div>
    </>
  );
};

const App = ({
  innerDesign,
  outerDesign,
}: {
  innerDesign: string;
  outerDesign: string;
}) => {
  const innerDesignClass = AllInnerDesigns.find((d) => d.name == innerDesign);
  const outerDesignClass = AllOuterDesigns.find((d) => d.name == outerDesign);

  if (!innerDesignClass || !outerDesignClass) {
    return <div>Design not found</div>;
  }

  const modelMaker: OuterPaperModelMaker = new outerDesignClass(
    new innerDesignClass()
  );

  return (
    <div>
      <Renderer modelMaker={modelMaker} />
    </div>
  );
};

export default App;
