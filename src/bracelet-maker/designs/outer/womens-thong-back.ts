// TODO: add incisions
import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { GenericCurvedOuterModelMaker } from "./generic-curved-outer-model-maker";

export class WomensThongBack extends GenericCurvedOuterModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Body Circumference Around the Navel (inches)",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "bodyCircumferenceAroundTheNavel",
      }),
    ];
  }

  public controlInfo = "It's a box";

  public async makePath(paper: paper.PaperScope, params: any) {
    const { bodyCircumferenceAroundTheNavel } = params;

    const outerModel: paper.Path = new paper.Path();
    outerModel.add(new paper.Point(0, 0));
    // initial rise
    outerModel.lineBy([1, 3.2]);

    // waist dip
    outerModel.curveBy(
      [6, -1], // through
      [12, 0] // to
    );
    // right "fall"
    outerModel.lineBy([1, -3.2]);

    // right leg
    outerModel.curveBy(
      [-5, -6.8], // through
      [-5.2, -14.8] // to
    );
    // across the crotch
    outerModel.lineBy([-3.6, 0]);

    // up the left leg
    outerModel.curveBy(
      [-0.2, 8], // through
      [-5.2, 14.8] // to
    );
    outerModel.closePath();

    // flip it upside down
    outerModel.scale(1, -1);

    // and scale it such that the width is the circumference
    outerModel.scale(outerModel.bounds.width / bodyCircumferenceAroundTheNavel);

    return outerModel;
  }
}
