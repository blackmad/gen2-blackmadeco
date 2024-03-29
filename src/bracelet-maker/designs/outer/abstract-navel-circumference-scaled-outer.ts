import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { GenericCurvedOuterModelMaker } from "./generic-curved-outer-model-maker";

export async function basicPercentageMakeSafeCone(
  paper: paper.PaperScope,
  params: any,
  outerModel: paper.Path,
  percentage: number
): Promise<paper.Path> {
  const bounds = outerModel.bounds;
  const newBounds = new paper.Rectangle(bounds.topLeft, [
    bounds.width,
    bounds.height * percentage,
  ]);
  addToDebugLayer(paper, "safeConeBounds", new paper.Path.Rectangle(newBounds));
  const safeCone = outerModel.intersect(new paper.Path.Rectangle(newBounds));
  addToDebugLayer(paper, "safeCone1", safeCone);
  return flattenArrayOfPathItems(paper, safeCone)[0];
}

export abstract class AbstractNavelCircumferenceScaledOuter extends GenericCurvedOuterModelMaker {
  abstract unitsPerA: number;
  abstract navelCircumferenceToAMultiplier: number;

  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Body Circumference Around the Navel (inches)",
        min: 0.1,
        max: 20,
        value: 38,
        step: 0.01,
        name: "bodyCircumferenceAroundTheNavel",
      }),
      new RangeMetaParameter({
        title: "Seam Allowance (inches)",
        min: 0,
        max: 20,
        value: 0,
        step: 0.1,
        name: "seamAllowance",
      }),
    ];
  }
  abstract makeUpsideDownUnscaledOuter(
    paper: paper.PaperScope,
    params: any
  ): Promise<paper.Path>;

  public async makeSafeCone(
    paper: paper.PaperScope,
    params: any,
    outerModel: paper.Path
  ): Promise<paper.Path> {
    console.log("existing makeSafeCone impl");
    return outerModel;
  }

  public async makePath(
    paper: paper.PaperScope,
    params: any
  ): Promise<{
    outerModel: paper.Path;
    safeCone?: paper.Path;
  }> {
    const { bodyCircumferenceAroundTheNavel, seamAllowance } = params;

    const outerModel = await this.makeUpsideDownUnscaledOuter(paper, params);

    outerModel.closePath();

    // flip it upside down
    outerModel.scale(1, -1);

    // and scale it such that the width is the circumference
    outerModel.scale(
      (bodyCircumferenceAroundTheNavel * this.navelCircumferenceToAMultiplier) /
        this.unitsPerA
    );

    // The models were all drawn from patterns that had a 3/8th seam allowance,
    // so to make 0 seam allowance work, subtract 3/8ths of an inch
    const outerModelAdjustedForSeamAllowance = flattenArrayOfPathItems(
      paper,
      PaperOffset.offset(outerModel, seamAllowance - 3 / 8)
    )[0];

    const firstSafeCone = await this.makeSafeCone(
      paper,
      params,
      outerModelAdjustedForSeamAllowance
    );

    return {
      outerModel: outerModelAdjustedForSeamAllowance,
      safeCone: firstSafeCone,
    };
  }
}
