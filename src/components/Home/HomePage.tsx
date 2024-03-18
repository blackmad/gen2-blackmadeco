import * as _ from "lodash";
import * as paper from "paper";
import { FC, useEffect, useRef, useState } from "react";

import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import { makeSVGData } from "../../bracelet-maker/utils/paperjs-export-utils";
import { MetaParameterBuilder } from "../../meta-parameter-builder";

const OuterMetaParamsContainer = ({
  params,
  modelMaker,
}: {
  params: any;
  modelMaker: OuterPaperModelMaker;
}) => {
  const [metaParamBuilder, setMetaParamBuilder] =
    useState<MetaParameterBuilder | null>(null);

  const outerParameterDivRef = useRef<HTMLDivElement>(null);
  const innerParameterDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const metaParamBuilder = new MetaParameterBuilder(
      params,
      (change: any) => {
        console.log("change!", change);
      }
      // _.bind(this.onParamChange, this)
    );
    setMetaParamBuilder(metaParamBuilder);
  }, [params]);
  // this.metaParamBuilder.buildMetaParametersForModel(
  //   this.modelMaker,
  //   document.getElementById("outerParameterDiv")
  // );

  useEffect(() => {
    if (
      !metaParamBuilder ||
      !modelMaker ||
      !outerParameterDivRef.current ||
      !innerParameterDivRef.current
    ) {
      return;
    }

    metaParamBuilder.buildMetaParametersForModel(
      modelMaker,
      outerParameterDivRef.current
    );

    metaParamBuilder.buildMetaParametersForModel(
      modelMaker.subModel,
      innerParameterDivRef.current
    );

    metaParamBuilder.rerender(params);
  }, [metaParamBuilder, modelMaker, params]);

  return (
    <div className="container px-xs-3 px-sm-3 px-md-4 px-lg-5">
      <div className="previewAreaPadding"></div>
      <div className="m-3">
        <h1 className="title">Sizing</h1>
        <small>
          <div className="sizingInfo patternInfo">
            {modelMaker ? modelMaker.controlInfo : ""}
          </div>
        </small>
        <div
          id="outerParameterDiv"
          ref={outerParameterDivRef}
          className="row clear-on-reinit"
        ></div>
      </div>

      <div id="parameterSection" className="m-3">
        <h1 className="title">Design</h1>
        <div className="patternInfo">
          <small>
            Not all of these variables do what they say. Consider them various
            ways to play with the randomness until you find a design you like.
          </small>
        </div>

        {/* <button @click="randomize">Randomize</button> */}

        <div
          id="innerParameterDiv"
          ref={innerParameterDivRef}
          className="row design-params-row"
        ></div>
      </div>

      <div
        id="parameterSection"
        className="m-3"
        v-if="debugLayerNames.length > 0"
      >
        <h1 className="title">Debug Layers</h1>

        {/* <div v-for="name in debugLayerNames" :key="name">
      <label :style="{ color: cssColor(name) }">
        <input type="checkbox" @click="toggleVisibility(name)" />
        {{ name }}
      </label>

    </div> */}
      </div>
    </div>
  );
};

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
  console.log("setting up paper");
  paper.setup(null);
  paper.settings.insertItems = false;
  paper.activate();

  if (paper != null && paper.project != null) {
    paper.project.activeLayer.removeChildren();
    _.forEach(getDebugLayers(), (v: paper.Group, _k) => {
      v.removeChildren();
    });
  }

  const [currentModel, setCurrentModel] = useState<CompletedModel | null>(null);
  const [modelParams, setModelParams] = useState<any>(null);

  useEffect(() => {
    if (modelMaker) {
      console.log("setting model params");
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

      setModelParams(modelParams);
    }
  }, [modelMaker]);

  useEffect(() => {
    if (!modelParams) {
      return;
    }
    console.log("making model");
    modelMaker.make(paper, modelParams).then(setCurrentModel);
  }, [modelMaker, modelParams]);

  if (!currentModel) {
    return <div>Loading...</div>;
  }

  console.log("rendering model");

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

  console.log("added child layer");

  _.forEach(getDebugLayers(), (v: paper.Group, _k: string) => {
    if (v.visible) {
      paper.project.activeLayer.addChild(v);
    }
  });

  const elHydrator = (svgData: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");
    return doc.firstChild;
  };

  const svgData = makeSVGData(paper, paper.project, false, elHydrator);
  console.log({ svgData });

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: svgData }} />
      <OuterMetaParamsContainer modelMaker={modelMaker} params={modelParams} />
    </div>
  );
};

const HomePage: FC = () => {
  const [innerDesign, _setInnerDesign] = useState<string>(
    AllInnerDesigns[0].name
  );
  const [outerDesign, _setOuterDesign] = useState<string>(
    AllOuterDesigns[0].name
  );

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

export default HomePage;
