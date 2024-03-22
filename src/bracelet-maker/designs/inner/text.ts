import _ from "lodash";
import makerjs from "makerjs";

import {
  MetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../../meta-parameter";
import { BundledFonts, loadFont } from "../../utils/font-utils";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignText extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const { boundaryModel, outerModel, fontSize, fontName, text, yOffset } =
      params;

    //load a font asynchronously
    const font = await loadFont(fontName);

    const textModel = new makerjs.models.Text(font, text, fontSize / 100);

    const svg = makerjs.exporter.toSVG(textModel);

    const importedItem = new paper.Item().importSVG(svg);
    // importedItem.fitBounds(boundaryModel.bounds, false);
    importedItem.translate(
      boundaryModel.bounds.center
        .subtract(importedItem.bounds.center)
        .add(new paper.Point(0, yOffset))
    );

    const paths = flattenArrayOfPathItems(paper, [importedItem]);

    return Promise.resolve({ paths });
  }

  get designMetaParameters(): Array<MetaParameter<any>> {
    return [
      new RangeMetaParameter({
        title: "Font Size",
        min: 0,
        max: 500,
        step: 1,
        value: 200,
        name: "fontSize",
      }),
      new SelectMetaParameter({
        title: "Font",
        options: _.map(BundledFonts, (b) => b.displayName),
        value: _.map(BundledFonts, (b) => b.displayName)[0],
        name: "fontName",
      }),
      new StringMetaParameter({
        title: "Text",
        defaults: ["Hello world.", "Hello.", "Hi.", "Hey.", "Sup.", "Yo."],
        value: "Hello world.",
        name: "text",
      }),
      new RangeMetaParameter({
        title: "Y Offset",
        min: -100,
        max: 100,
        step: 0.1,
        value: 0,
        name: "yOffset",
      }),
    ];
  }
}
