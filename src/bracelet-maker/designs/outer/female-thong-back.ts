// TODO: add incisions

import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems, mirrorPath } from "../../utils/paperjs-utils";
import { AbstractNavelCircumferenceScaledOuter } from "./abstract-navel-circumference-scaled-outer";

export class FemaleThongBack extends AbstractNavelCircumferenceScaledOuter {
  unitsPerA = 24;
  navelCircumferenceToAMultiplier = 0.4;

  public controlInfo = "It's a box";

  public async makeUpsideDownUnscaledOuter(paper: paper.PaperScope) {
    const outerModel: paper.Path = new paper.Path();
    outerModel.add(new paper.Point(0, 0));
    // initial rise
    outerModel.lineBy([1, 3.2]);

    // waist dip
    outerModel.curveBy(
      [3, -0.25], // through
      [6, -1] // to
    );

    outerModel.lineBy([0, -18]);

    // across the crotch
    outerModel.lineBy([-1.8, 0]);

    // up the left leg
    outerModel.curveBy(
      [-0.2, 8], // through
      [-5.2, 14.8] // to
    );

    outerModel.flatten(0.01);
    const flipped = mirrorPath({ path: outerModel, orientation: "horizontal" });
    flipped.translate([outerModel.bounds.width, 0]);
    addToDebugLayer(paper, "flipped", flipped);
    addToDebugLayer(paper, "outerModel", outerModel.clone());

    return flattenArrayOfPathItems(paper, outerModel.unite(flipped))[0];

    return outerModel;
  }
}
