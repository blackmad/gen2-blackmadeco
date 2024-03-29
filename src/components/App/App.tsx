import * as _ from "lodash";
import * as paper from "paper";
import { useCallback, useEffect, useState } from "react";
import { useModal } from "react-modal-hook";

import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import { makeUriQueryString } from "../../bracelet-maker/meta-parameter";
import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import { MetaParameterChange } from "../../meta-parameter-builder";
import DebugLayers from "./DebugLayers";
import { MetaParamsContainer } from "./MetaParamsContainer";
import { SVGRenderer } from "./SVGRenderer";

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
          if (!params[model]) {
            return;
          }
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
    // window.location.hash = "#"
  }, []);

  const [error, setError] = useState("");
  const [showModal, hideModal] = useModal(
    () => (
      <div
        className="alert alert-danger"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translate(-50%, 0)",
          margin: "auto",
        }}
      >
        <div className="toast-header">
          <strong className="mr-auto">Rendering Error</strong>
          <small>11 mins ago</small>
          <button
            type="button"
            className="ml-2 mb-1 close"
            data-dismiss="toast"
            aria-label="Close"
            onClick={hideModal}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="toast-body">{error}</div>
      </div>
    ),
    [error]
  );

  const rerender = useCallback(() => {
    hideModal();
    if (paper != null && paper.project != null) {
      paper.project.activeLayer.removeChildren();
      _.forEach(getDebugLayers(), (v: paper.Group, _k) => {
        v.removeChildren();
      });
    }

    // // This is totally stupid and broken
    const path = window.location.hash.split("?")[0];
    const hashParams = makeUriQueryString(modelParams);

    // history.pushState(undefined, "", "#" + path + "?" + hashParams);
    window.location.hash = path + "?" + hashParams;

    modelMaker
      .make(paper, modelParams)
      .then(setCurrentModel)
      .catch((e) => {
        console.error(e);
        console.log("setting error", e.message);
        setError(e.message.toString());
        showModal();
      });
  }, [hideModal, modelMaker, modelParams, showModal]);

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

  if (!currentModel && !error) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SVGRenderer
        currentModel={currentModel}
        paper={paper}
        modelParams={modelParams}
        modelMaker={modelMaker}
      />
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
