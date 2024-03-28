import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { GenericCurvedOuterModelMaker } from "./generic-curved-outer-model-maker";

export abstract class AbstractNavelCircumferenceScaledOuter extends GenericCurvedOuterModelMaker {
  abstract unitsPerA: number;
  abstract navelCircumferenceToAMultiplier: number;

  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Body Circumference Around the Navel (inches)",
        min: 0.1,
        max: 20,
        value: 30,
        step: 0.01,
        name: "bodyCircumferenceAroundTheNavel",
      }),
    ];
  }
  abstract makeUpsideDownUnscaledOuter(
    paper: paper.PaperScope,
    params: any
  ): Promise<paper.Path>;

  public async makePath(paper: paper.PaperScope, params: any) {
    const { bodyCircumferenceAroundTheNavel } = params;

    const outerModel = await this.makeUpsideDownUnscaledOuter(paper, params);

    outerModel.closePath();

    // flip it upside down
    outerModel.scale(1, -1);

    // and scale it such that the width is the circumference
    outerModel.scale(
      (bodyCircumferenceAroundTheNavel * this.navelCircumferenceToAMultiplier) /
        this.unitsPerA
    );

    return outerModel;
  }
}
