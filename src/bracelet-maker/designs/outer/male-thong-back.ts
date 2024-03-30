import {
  AbstractNavelCircumferenceScaledOuter,
  basicPercentageMakeSafeCone,
} from "./abstract-navel-circumference-scaled-outer";

export class MaleThongBack extends AbstractNavelCircumferenceScaledOuter {
  unitsPerA = 10;
  navelCircumferenceToAMultiplier = 0.12;

  override async makeSafeCone(
    paper: paper.PaperScope,
    params: any,
    outerModel: paper.Path
  ): Promise<paper.Path> {
    return basicPercentageMakeSafeCone(paper, params, outerModel, 0.4);
  }

  public async makeUpsideDownUnscaledOuter(paper: paper.PaperScope) {
    const outerModel: paper.Path = new paper.Path();
    outerModel.add(new paper.Point(0, 0));
    // initial rise
    outerModel.lineBy([1, 4.2]);

    // waist dip
    outerModel.curveBy(
      [10, -2], // through
      [20, 0] // to
    );
    // right "fall"
    outerModel.lineBy([1, -4.2]);

    // right leg
    outerModel.curveBy(
      [-8, -4.8], // through
      [-8.8, -18.8] // to
    );
    // across the crotch
    outerModel.lineBy([-4.4, 0]);

    // up the left leg
    outerModel.curveBy(
      [-0.8, 14], // through
      [-8.8, 18.8] // to
    );
    return outerModel;
  }
}
