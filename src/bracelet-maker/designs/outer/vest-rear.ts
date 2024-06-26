import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems, mirrorPath } from "../../utils/paperjs-utils";
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
    const baseOfCrotchToShoulder = 29;
    const totalHeight = 0.85 * baseOfCrotchToShoulder + 2.25;
    const A = totalHeight;
    const breastCircumference = 42;
    const width = 0.5 * breastCircumference - 0.75;
    const B = width;
    const shoulderRise = 2;
    const D = shoulderRise;
    const shoulderCirfumfercnce = 17.5;
    const armpitHeight = 0.5 * shoulderCirfumfercnce + 0.75;
    const C = armpitHeight;

    const path = new paper.Path();

    path.add(new paper.Point(0, 0));

    // go up left
    const flatUpRun = A - D - C;
    path.lineBy([0, flatUpRun]);

    const halfWidth = 0.5 * B;

    // armpit hole!
    path.curveBy(
      [(1 / 8) * halfWidth, (2 / 7) * armpitHeight], // through
      [0, armpitHeight] // to
    );

    const shoulderRiseLength = (5 / 8) * halfWidth;
    const neckHoleLength = (3 / 8) * halfWidth;

    // shoulder
    path.lineBy([shoulderRiseLength, 2]);

    // neck hole
    path.curveBy(
      [(1 / 3) * neckHoleLength, -0.5], // through
      [neckHoleLength, -1] // to
    );

    // race down, only doing half
    path.lineBy([0, -A + 1]);

    // back to start for sanity
    path.lineBy([-8, 0]);

    return Promise.resolve(path);
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

    outerModel.flatten(0.005);
    const flipped = mirrorPath({ path: outerModel, orientation: "horizontal" });
    flipped.translate([outerModel.bounds.width, 0]);
    addToDebugLayer(paper, "flipped", flipped);
    addToDebugLayer(paper, "outerModel", outerModel.clone());
    addToDebugLayer(paper, "halfOuterModel", outerModel.clone());

    const finalOuterModel = flattenArrayOfPathItems(
      paper,
      outerModel.unite(flipped)
    )[0];

    addToDebugLayer(paper, "finalOuterModel", finalOuterModel.clone());

    return {
      outerModel: finalOuterModel,
    };
  }
}
