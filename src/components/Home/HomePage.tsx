import * as _ from "lodash";
import * as paper from "paper";
import { FC, useEffect, useState } from "react";

import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import {
  CompletedModel,
  OuterPaperModelMaker,
} from "../../bracelet-maker/model-maker";
import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";
import { makeSVGData } from "../../bracelet-maker/utils/paperjs-export-utils";

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

  if (paper != null && paper.project != null) {
    paper.project.activeLayer.removeChildren();
    _.forEach(getDebugLayers(), (v: paper.Group, _k) => {
      v.removeChildren();
    });
  }

  const [currentModel, setCurrentModel] = useState<CompletedModel | null>(null);

  const initialOuterParams: Record<string, number | string> = {};

  modelMaker.outerMetaParameters.forEach((metaParam) => {
    initialOuterParams[metaParam.name] = metaParam.value;
  });

  // modelMaker.metaParameters.forEach((metaParam) => {
  //   initialParams[metaParam.name] = metaParam.value;
  // });

  const modelParams = {};
  modelParams[modelMaker.constructor.name] = initialOuterParams;

  // (params as any).breakThePlane = false;

  // params["seed"] = 1;

  // const inputParams = {...params};

  // params[designClass.constructor.name] = params;

  // // const outerRect = new paper.Path.Rectangle(bounds);
  // // const boundaryRect = outerRect.clone();
  // // boundaryRect.scale(0.95);
  // // params["boundaryModel"] = boundaryRect;
  // // params["outerModel"] = outerRect;
  // // params["safeCone"] = boundaryRect;

  useEffect(() => {
    modelMaker.make(paper, modelParams).then(setCurrentModel);
  }, [modelMaker, modelParams]);

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

  const elHydrator = (svgData: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");
    return doc.firstChild;
  };

  const svgData = makeSVGData(paper, paper.project, false, elHydrator);
  console.log({ svgData });

  return <div dangerouslySetInnerHTML={{ __html: svgData }} />;
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

  return <Renderer modelMaker={modelMaker} />;
};

export default HomePage;
