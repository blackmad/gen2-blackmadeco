import * as _ from "lodash";
import * as paper from "paper";
import { useCallback, useEffect, useState } from "react";

import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import { makeUriQueryString } from "../../bracelet-maker/meta-parameter";
import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import {
  makeSVGData,
  svgStringHydrator,
} from "../../bracelet-maker/utils/svg-utils";
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
      const params = {
        [modelMaker.constructor.name]: {},
        [modelMaker.subModel.constructor.name]: {},
      };

      modelMaker.outerMetaParameters.forEach((metaParam) => {
        params[modelMaker.constructor.name][metaParam.name] = metaParam.value;
      });

      modelMaker.subModel.metaParameters.forEach((metaParam) => {
        params[modelMaker.subModel.constructor.name][metaParam.name] =
          metaParam.value;
      });

      function getParsedValue(model: string, name: string, value: string) {
        if (model === modelMaker.constructor.name) {
          const metaParam = modelMaker.outerMetaParameters.find(
            (mp) => mp.name === name
          );
          if (metaParam) {
            return metaParam.valueFromString(value);
          }
        } else {
          const metaParam = modelMaker.subModel.metaParameters.find(
            (mp) => mp.name === name
          );
          if (metaParam) {
            return metaParam.valueFromString(value);
          }
        }
      }

      window.location.hash
        .substring(1)
        .split("?")[1]
        ?.split("&")
        .filter((param) => param.length > 0)
        .forEach((param) => {
          const [key, value] = param.split("=");
          const [model, name] = decodeURIComponent(key).split(".");
          params[model][name] = getParsedValue(
            model,
            name,
            decodeURIComponent(value)
          );
        });

      setModelParams(params);
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

    // // This is totally stupid and broken
    const path = window.location.hash.split("?")[0];
    const hashParams = makeUriQueryString(modelParams);

    // history.replaceState(undefined, "", "#" + path + "?" + hashParams);
    window.location.hash = path + "?" + hashParams;

    modelMaker.make(paper, modelParams).then(setCurrentModel);
  }, [modelMaker, modelParams]);

  const changeCallback = useCallback(
    (change: MetaParameterChange) => {
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
    children: [currentModel.outer],
    strokeColor: "red",
    strokeWidth: "0.005",
    fillColor: "lightslategrey",
    fillRule: "evenodd",
  });
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

  const svgData = makeSVGData(
    paper,
    paper.project,
    false,
    svgStringHydrator,
    modelParams
  );

  console.log({ svgData });

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
      <div className="container px-xs-3 px-sm-3 px-md-4 px-lg-5">
        <div className="previewAreaPadding"></div>
        <DebugLayers onChange={rerender} />

        {modelParams && (
          <MetaParamsContainer
            modelMaker={modelMaker}
            params={modelParams}
            onChange={changeCallback}
            rerenderCallback={rerender}
          />
        )}

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
