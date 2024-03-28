// TODO: add incisions
import { AbstractNavelCircumferenceScaledOuter } from "./abstract-navel-circumference-scaled-outer";

export class MaleThongFront extends AbstractNavelCircumferenceScaledOuter {
  unitsPerA = 10;
  navelCircumferenceToAMultiplier = 0.12;

  public controlInfo =
    "Front piece for male thong - <b> Make sure to print TWO of these</b>";

  public async makeUpsideDownUnscaledOuter(paper: paper.PaperScope) {
    const outerModel: paper.Path = new paper.Path();

    outerModel.add(new paper.Point(0, 0));
    // initial rise
    outerModel.lineBy([0, 2.2]);

    // top curve
    outerModel.curveBy(
      [6, 3], // through
      [8, 7.8] // to
    );

    // left run up
    outerModel.lineBy([0, 8]);

    // top straight run across
    outerModel.lineBy([10, 0]);

    // right run down
    outerModel.lineBy([0, -7]);

    // // bottom curve
    outerModel.curveBy(
      [-4, -8], // through
      [-9, -11] // to
    );

    // straight bottom run
    outerModel.lineBy([-9, 0]);

    // back to home for sanit y
    outerModel.lineBy([0, 2.2]);

    return outerModel;
  }
}
