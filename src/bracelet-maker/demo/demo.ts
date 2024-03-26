import * as _ from "lodash";

import {
  CompletedModel,
  InnerCompletedModel,
  OuterPaperModelMaker,
  PaperModelMaker,
} from "../model-maker";
import { makeSVGData } from "../utils/svg-utils";

export async function demoDesign(
  paper: paper.PaperScope,
  designClass: PaperModelMaker | OuterPaperModelMaker,
  elHydrator: (svgData: string) => any,
  shouldRandomize: boolean,
  bounds: paper.Rectangle = new paper.Rectangle(0, 0, 3, 1.5),
  initialParams: any = {},
  numMetaParametersToChange: number = 1000
) {
  const params = { ...initialParams };

  _.shuffle(designClass.metaParameters)
    .slice(0, numMetaParametersToChange)
    .forEach((metaParam) => {
      if (shouldRandomize) {
        params[metaParam.name] = metaParam.getRandomValue();
      } else {
        params[metaParam.name] = metaParam.value;
      }
    });

  (params as any).breakThePlane = false;

  params["seed"] = shouldRandomize ? params["seed"] : 1;

  const inputParams = { ...params };

  params[designClass.constructor.name] = params;

  const outerRect = new paper.Path.Rectangle(bounds);
  const boundaryRect = outerRect.clone();
  boundaryRect.scale(0.95);
  params["boundaryModel"] = boundaryRect;
  params["outerModel"] = outerRect;
  params["safeCone"] = boundaryRect;

  const innerDesign = await designClass.make(paper, params);

  let paths: paper.PathItem[] = [];
  if (innerDesign instanceof CompletedModel) {
    paths = [(<CompletedModel>innerDesign).outer];
  } else {
    const innerPaths = (<InnerCompletedModel>innerDesign).paths;

    paths = [outerRect, ...innerPaths];
  }

  const path = new paper.CompoundPath({
    children: paths,
    strokeColor: "red",
    strokeWidth: "0.005",
    fillColor: "lightgrey",
    fillRule: "evenodd",
  });

  const outerArea = outerRect.area;
  const innerArea = path.area;

  console.log({ outerArea, innerArea }, innerArea / outerArea);
  console.log({ path });

  paper.project.activeLayer.addChild(path);
  const svg = makeSVGData(paper.project, false, elHydrator, {});

  return {
    svg,
    params: inputParams,
  };
}
