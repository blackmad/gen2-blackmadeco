import { FC, useRef, useState } from "react";
import ReactTypescriptTemplateLogo from "../../assets/images/react-typescript-template.png";
import { AllInnerDesigns } from "../../bracelet-maker/designs/inner/all";
import { AllOuterDesigns } from "../../bracelet-maker/designs/outer/all";
import * as paper from "paper";

const Canvas = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas = canvasRef.current;

  if (!canvas) {
    return <div>Bad Canvas</div>;
  }

  // const context = canvas.getContext("2d");

  paper.setup(canvas);
  paper.settings.insertItems = false;
  paper.activate();

  return <canvas ref={canvasRef} {...props} />;
};

const Renderer: FC = () => {
  // const previewDiv = document.getElementById("previewArea");

  // $("body").addClass("loading");
  // $("body").removeClass("error");
  // $(".playArea").show();

  // rebuild params from X.a to {X: {a: }}
  let modelParams = new Map<string, any>();
  if (this.modelMaker.subModel) {
    _.each(this.params, (value, key) => {
      const parts = key.split(".");
      if (parts.length == 2) {
        modelParams[parts[0]] = modelParams[parts[0]] || {};
        modelParams[parts[0]][parts[1]] = value;
      } else {
        throw new Error("param does not have a dot: " + key);
      }
    });
  } else {
    modelParams = new Map(this.params);
  }

  const canvas: HTMLCanvasElement = document.getElementById(
    "myCanvas"
  ) as HTMLCanvasElement;
  const paper1 = new paper.PaperScope();
  paper.setup(canvas);
  paper.settings.insertItems = false;
  paper.activate();

  if (paper != null && paper.project != null) {
    paper.project.activeLayer.removeChildren();
    _.forEach(getDebugLayers(), (v: paper.Group, k) => {
      v.removeChildren();
    });
  }

  this.currentModel = await this.modelMaker.make(paper, modelParams);

  const compoundPath = new paper.CompoundPath({
    children: [
      this.currentModel.outer,
      ...this.currentModel.holes,
      ...this.currentModel.design,
    ],
    strokeColor: "red",
    strokeWidth: "0.005",
    fillColor: "lightgrey",
    fillRule: "evenodd",
  });

  paper.project.activeLayer.addChild(compoundPath);

  _.forEach(getDebugLayers(), (v: paper.Group, k: string) => {
    if (v.visible) {
      paper.project.activeLayer.addChild(v);
    }
  });

  $("#svgArea")[0].innerHTML = makeSVGData(
    paper,
    paper.project,
    false,
    (svg) => $(svg)[0]
  );

  $("body").removeClass("loading");
};

const HomePage: FC = () => {
  const [innerDesign, setInnerDesign] = useState<string>(
    AllInnerDesigns[0].name
  );
  const [outerDesign, setOuterDesign] = useState<string>(
    AllOuterDesigns[0].name
  );

  const innerDesignClass = AllInnerDesigns.find((d) => d.name == innerDesign);
  const outerDesignClass = AllOuterDesigns.find((d) => d.name == outerDesign);

  if (!innerDesignClass || !outerDesignClass) {
    return <div>Design not found</div>;
  }

  const modelMaker = new outerDesignClass(new innerDesignClass());

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold my-2">React Typescript Template</h1>
      <img
        src={ReactTypescriptTemplateLogo}
        width={500}
        className="mx-auto"
        alt="React-Typescript-Template"
      />
    </div>
  );
};

export default HomePage;
