import _ from "lodash";
import TextToSVG from "text-to-svg";

import {
  MetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../../meta-parameter";
import { BundledFonts, getFontPath } from "../../utils/font-utils";
import { flattenArrayOfPathItems, healHoles } from "../../utils/paperjs-utils";
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
      horizontalHealingBarHeight,
      verticalHealingBarWidth,
      xScale,
      yScale,
      letterSpacing,
      lineHeight,
    } = params;

    // balance splitting text across n lines
    const textArray = text.split(" ");
    const textChunks = _.chunk(textArray, Math.ceil(textArray.length / lines));
    const textLines = textChunks.map((line) => line.join(" "));

    let paths: paper.Item[] = [];

    // First argument is URL on web browsers, but it is file path on Node.js.
    const textToSVG: TextToSVG = await new Promise((resolve, reject) => {
      TextToSVG.load(getFontPath(fontName), function (err, textToSVG) {
        if (err) {
          reject(err);
        } else {
          resolve(textToSVG);
        }
      });
    });

    const maxLineHeight =
      Math.max(
        ...textLines.map((line, i) => {
          // const textModel = new makerjs.models.Text(font, line, fontSize / 100);

          // const svg = makerjs.exporter.toSVG(textModel);
          const svg = textToSVG.getSVG(line, {
            letterSpacing,
            fontSize: fontSize / 100,
          });
          console.log({ svg });

          const importedItem = new paper.Item().importSVG(svg);
          return importedItem.bounds.height;
        })
      ) * lineHeight;

    let accumulatedYOffset =
      yOffset + (boundaryModel.bounds.height - maxLineHeight * lines) / 2;

    textLines.forEach((line, i) => {
      const svg = textToSVG.getSVG(line, {
        letterSpacing,
        fontSize: fontSize / 100,
        anchor: "left top",
      });

      const importedItem = new paper.Item().importSVG(svg);
      importedItem.scale(xScale, 1);

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

      console.log("healing holes");
      const fixedPaths = healHoles({
        paper,
        paths: [importedItem],
        horizontalHealingBarHeight,
        verticalHealingBarWidth,
      });
      // debugger;
      paths = [...paths, ...flattenArrayOfPathItems(paper, fixedPaths)];
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
        defaults: ["Hello world", "Hello", "Hi", "Hey", "Sup", "Yo"],
        value: "Hello world",
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
        title: "xScale",
        min: -100,
        max: 100,
        step: 0.1,
        value: 1.2,
        name: "xScale",
      }),
      new RangeMetaParameter({
        title: "Lines",
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "lines",
      }),
      new RangeMetaParameter({
        title: "Line Height",
        min: 0.1,
        max: 10,
        step: 0.1,
        value: 1.2,
        name: "lineHeight",
      }),
      // new RangeMetaParameter({
      //   title: "Horizontal Healing Bar Height",
      //   min: -100,
      //   max: 100,
      //   step: 0.1,
      //   value: 0.1,
      //   name: "horizontalHealingBarHeight",
      // }),
      new RangeMetaParameter({
        title: "Veritical Healing Bar Width",
        min: -100,
        max: 100,
        step: 0.075,
        value: 0.025,
        name: "verticalHealingBarWidth",
      }),
      new RangeMetaParameter({
        title: "letterSpacing",
        min: -100,
        max: 100,
        step: 0.05,
        value: 0.0,
        name: "letterSpacing",
      }),
    ];
  }
}
