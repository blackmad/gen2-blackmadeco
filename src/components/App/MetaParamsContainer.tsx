import { useCallback, useEffect, useRef, useState } from "react";

import { OuterPaperModelMaker } from "../../bracelet-maker/model-maker";
import {
  MetaParameterBuilder,
  MetaParameterChangeCallback,
} from "../../meta-parameter-builder";

export const MetaParamsContainer = ({
  params,
  modelMaker,
  onChange,
  rerenderCallback,
}: {
  params: any;
  modelMaker: OuterPaperModelMaker;
  onChange: MetaParameterChangeCallback;
  rerenderCallback: () => void;
}) => {
  const [metaParamBuilder, setMetaParamBuilder] =
    useState<MetaParameterBuilder | null>(null);

  const outerParameterDivRef = useRef<HTMLDivElement>(null);
  const innerParameterDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const metaParamBuilder = new MetaParameterBuilder(
      params,
      onChange,
      rerenderCallback
    );
    setMetaParamBuilder(metaParamBuilder);
  }, [params, onChange, rerenderCallback]);

  const randomize = useCallback(() => {
    if (!metaParamBuilder) {
      return;
    }
    metaParamBuilder.randomize();
  }, [metaParamBuilder]);

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
          <div
            className="sizingInfo patternInfo"
            dangerouslySetInnerHTML={{
              __html: modelMaker ? modelMaker.controlInfo : "",
            }}
          ></div>
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

        <button onClick={randomize}>Randomize</button>

        <div
          id="innerParameterDiv"
          ref={innerParameterDivRef}
          className="row design-params-row"
        ></div>
      </div>
    </div>
  );
};
