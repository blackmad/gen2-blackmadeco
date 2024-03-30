import { PaperOffset } from "paperjs-offset";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { GenericCurvedOuterModelMaker } from "./generic-curved-outer-model-maker";

export abstract class VestRearOuter extends GenericCurvedOuterModelMaker {
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
  makeUpsideDownUnscaledOuter(
    paper: paper.PaperScope,
    params: any
  ): Promise<paper.Path> {
    const path = new paper.Path();

    path.add(new paper.Point(0, 0));

    // go up left
    path.lineBy([0, 15]);

    // armpit hole!
    path.curveBy(
      [1, 2], // through
      [0, 7] // to
    );

    // shoulder
    path.lineBy([5, 2]);

    // neck hole
    path.curveBy(
      [1, -0.5], // through
      [3, -1] // to
    );

    // race down, only doing half
    path.lineBy([0, -23]);

    // back to start for sanity
    path.lineBy([-8, 0]);

    return path;
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

    const firstSafeCone = outerModelAdjustedForSeamAllowance;

    return {
      outerModel: outerModelAdjustedForSeamAllowance,
      safeCone: firstSafeCone,
    };
  }
}
