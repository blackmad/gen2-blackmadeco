// TODO: add incisions

import { AbstractNavelCircumferenceScaledOuter } from "./navel-circumference-scaled-outer";

export class WomensThongBack extends AbstractNavelCircumferenceScaledOuter {
  public controlInfo = "It's a box";

  public async makeUpsideDownUnscaledOuter(paper: paper.PaperScope) {
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

    return outerModel;
  }
}
