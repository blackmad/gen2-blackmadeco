// TODO: add incisions
import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { GenericCurvedOuterModelMaker } from "./generic-curved-outer-model-maker";

export function femaleThongUnitToInches(
  bodyCircumferenceAroundTheNavel: number
) {
  return (bodyCircumferenceAroundTheNavel * 0.4) / 24;
}

export class WomensThongFront extends GenericCurvedOuterModelMaker {
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
    outerModel.lineBy([2, 3]);

    // waist dip
    outerModel.curveBy(
      [10, -2.5], // through
      [20, 0] // to
    );
    // right "fall"
    outerModel.lineBy([2, -3]);

    // right leg
    outerModel.curveBy(
      [-9, -8.5], // through
      [-10, -19] // to
    );
    // across the crotch
    outerModel.lineBy([-4, 0]);

    // up the left leg
    outerModel.curveBy(
      [-1.5, 10], // through
      [-10, 19] // to
    );

    outerModel.closePath();

    // flip it upside down
    outerModel.scale(1, -1);

    // and scale it such that the width is the circumference
    outerModel.scale(outerModel.bounds.width / bodyCircumferenceAroundTheNavel);

    return outerModel;
  }
}
