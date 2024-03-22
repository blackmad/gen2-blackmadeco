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
    const {
      boundaryModel,
      outerModel,
      fontSize,
      fontName,
      text,
      yOffset,
      lines,
    } = params;

    //load a font asynchronously
    const font = await loadFont(fontName);

    // balance splitting text across n lines
    const textArray = text.split(" ");
    const textChunks = _.chunk(textArray, Math.ceil(textArray.length / lines));
    const textLines = textChunks.map((line) => line.join(" "));

    let paths = [];

    const maxLineHeight = Math.max(
      ...textLines.map((line, i) => {
        const textModel = new makerjs.models.Text(font, line, fontSize / 100);

        const svg = makerjs.exporter.toSVG(textModel);

        const importedItem = new paper.Item().importSVG(svg);
        return importedItem.bounds.height;
      })
    );

    let accumulatedYOffset =
      yOffset + (boundaryModel.bounds.height - maxLineHeight * lines) / 2;

    textLines.forEach((line, i) => {
      const textModel = new makerjs.models.Text(font, line, fontSize / 100);

      const svg = makerjs.exporter.toSVG(textModel);

      const importedItem = new paper.Item().importSVG(svg);
      // importedItem.fitBounds(boundaryModel.bounds, false);
      console.log(
        importedItem.bounds.center,
        importedItem.bounds.height,
        accumulatedYOffset
      );
      importedItem.translate(
        [
          boundaryModel.bounds.center.x - importedItem.bounds.center.x,
          accumulatedYOffset,
        ]
        // boundaryModel.bounds.center
        //   .subtract(importedItem.bounds.center)
        //   .add(new paper.Point(0, accumulatedYOffset))
      );

      accumulatedYOffset += maxLineHeight;
      paths = [...paths, ...flattenArrayOfPathItems(paper, [importedItem])];
    });

    return Promise.resolve({ paths });
  }

  get designMetaParameters(): Array<MetaParameter<any>> {
    return [
      new RangeMetaParameter({
        title: "Font Size",
        min: 0,
        max: 500,
        step: 1,
        value: 100,
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
      new RangeMetaParameter({
        title: "Lines",
        min: 1,
        max: 10,
        step: 1,
        value: 1,
        name: "lines",
      }),
    ];
  }
}
