// TODO: add incisions
import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems, mirrorPath } from "../../utils/paperjs-utils";
import { AbstractNavelCircumferenceScaledOuter } from "./abstract-navel-circumference-scaled-outer";

export class FemaleThongFront extends AbstractNavelCircumferenceScaledOuter {
  unitsPerA = 24;
  navelCircumferenceToAMultiplier = 0.4;

  public async makeUpsideDownUnscaledOuter(paper: paper.PaperScope) {
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

    outerModel.flatten(0.01);
    const flipped = mirrorPath({ path: outerModel, orientation: "horizontal" });
    addToDebugLayer(paper, "flipped", flipped);
    addToDebugLayer(paper, "outerModel", outerModel.clone());

    return flattenArrayOfPathItems(paper, outerModel.unite(flipped))[0];
    return outerModel;
  }
}
