import _ from "lodash";
import TextToSVG from "text-to-svg";

import {
  MetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
  StringMetaParameter,
} from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { BundledFonts, getFontPath } from "../../utils/font-utils";
import { flattenArrayOfPathItems, healHoles } from "../../utils/paperjs-utils";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

function fillAGrid({
  paper,
  bounds,
  boxSize,
  borderSize,
  omitChance,
}: {
  paper: paper.PaperScope;
  bounds: paper.Rectangle;
  boxSize: number;
  borderSize: number;
  omitChance: number;
}) {
  const boxes = [];
  const boxGrid: Array<Array<paper.PathItem | null>> = [];
  let xIndex = 0;
  for (
    let x = bounds.x - (boxSize + borderSize);
    x <= bounds.x + bounds.width;
    x += boxSize + borderSize
  ) {
    let yIndex = 0;
    for (
      let y = bounds.y - (boxSize + borderSize);
      y <= bounds.y + bounds.height + (boxSize + borderSize);
      y += boxSize + borderSize
    ) {
      const rect = new paper.Path.Rectangle(
        new paper.Rectangle(x, y, boxSize, boxSize)
      );
      boxGrid[xIndex] = boxGrid[xIndex] ?? [];
      boxGrid[xIndex][yIndex] = rect;
      yIndex += 1;
    }
    xIndex++;
  }

  // Randomly select groups of four boxes to union together
  const numDeletes = boxGrid.length * boxGrid[0].length * omitChance * 0.25;
  for (let i = 0; i < numDeletes; i++) {
    const x = Math.floor(Math.random() * boxGrid.length);
    console.log({ x }, boxGrid[x]);
    const y = Math.floor(Math.random() * boxGrid[x].length);
    const rect = boxGrid[x][y];
    if (rect) {
      boxGrid[x]?.[y] = null;
      boxGrid[x + 1]?.[y] = null;
      boxGrid[x]?.[y + 1] = null;
      boxGrid[x + 1]?.[y + 1] = null;
      // const rectRight = boxGrid[x + 1]?.[y];
      // const rectBottom = boxGrid[x]?.[y + 1];
      // const rectBottomRight = boxGrid[x + 1]?.[y + 1];
      // if (rectRight && rectBottom && rectBottomRight) {
      //   console.log({ x, y }, "is becoming big");
      //   console.log(rect, rectRight, rectBottom, rectBottomRight);
      //   boxGrid[x][y] = new paper.Path.Rectangle(rect.bounds.topLeft, [
      //     boxSize * 2 + borderSize,
      //     boxSize * 2 + borderSize,
      //   ]);

      //   console.log("new box", boxGrid[x][y]?.bounds);
      //   boxGrid[x + 1][y] = null;
      //   boxGrid[x][y + 1] = null;
      //   boxGrid[x + 1][y + 1] = null;
      // }
    }
  }

  for (let x = 0; x < boxGrid.length; x += 1) {
    for (let y = 0; y < boxGrid[x].length; y += 1) {
      const rect = boxGrid[x][y];
      if (rect) {
        boxes.push(rect);
      }
    }
  }

  console.log({ boxes });

  const compoundPath = new paper.CompoundPath(boxes);
  addToDebugLayer(paper, "grid", compoundPath);

  return compoundPath;
}

export class InnerDesignText extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const {
      boundaryModel,
      outerModel,
      fontSize,
      fontName,
      text,
      yOffset,
      xOffset,
      lines,
      horizontalHealingBarHeight,
      verticalHealingBarWidth,
      xScale,
      yScale,
      letterSpacing,
      lineHeight,
      useBackgroundGrid,
      backgroundGridBorderWidth,
      backgroundGridSize,
      backgroundGridOmitChance,
    } = params;

    const shouldHealHoles = true;

    // balance splitting text across n lines
    const textArray = text.split(" ");
    const textChunks = _.chunk(textArray, Math.ceil(textArray.length / lines));
    const textLines = textChunks.map((line) => line.join(" "));

    let paths: paper.Item[] = [];

    const grid = useBackgroundGrid
      ? fillAGrid({
          paper,
          bounds: boundaryModel.bounds,
          boxSize: backgroundGridSize,
          borderSize: backgroundGridBorderWidth,
          omitChance: backgroundGridOmitChance,
        })
      : undefined;

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

      importedItem.translate([
        boundaryModel.bounds.center.x - importedItem.bounds.center.x + xOffset,
        accumulatedYOffset,
      ]);

      accumulatedYOffset += maxLineHeight;

      console.log("healing holes");
      const fixedPaths = shouldHealHoles
        ? healHoles({
            paper,
            paths: [importedItem],
            horizontalHealingBarHeight,
            verticalHealingBarWidth,
          })
        : [importedItem];
      // debugger;
      paths = [...paths, ...flattenArrayOfPathItems(paper, fixedPaths)];
    });

    const compoundTextPath = new paper.CompoundPath(paths);
    const unionedGrid = useBackgroundGrid
      ? compoundTextPath.unite(grid)
      : compoundTextPath;
    addToDebugLayer(paper, "unionGrid", unionedGrid);

    return Promise.resolve({ paths: [unionedGrid] });
  }

  get designMetaParameters(): Array<MetaParameter<any>> {
    return [
      new RangeMetaParameter({
        title: "Font Size",
        min: 0,
        max: 500,
        step: 1,
        value: 70,
        name: "fontSize",
      }),
      new SelectMetaParameter({
        title: "Font",
        options: _.map(BundledFonts, (b) => b.displayName),
        value: "New Rocker",
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
        title: "X Offset",
        min: -100,
        max: 100,
        step: 0.1,
        value: 0,
        name: "xOffset",
      }),
      new RangeMetaParameter({
        title: "xScale",
        min: -100,
        max: 100,
        step: 0.1,
        value: 1.8,
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
        value: 0.075,
        name: "verticalHealingBarWidth",
      }),
      new RangeMetaParameter({
        title: "letterSpacing",
        min: -100,
        max: 100,
        step: 0.05,
        value: 0.1,
        name: "letterSpacing",
      }),
      // new OnOffMetaParameter({
      //   title: "useBackgroundGrid",
      //   value: false,
      //   name: "useBackgroundGrid",
      // }),
      // new RangeMetaParameter({
      //   title: "backgroundGridSize",
      //   min: 0.001,
      //   max: 100,
      //   step: 0.01,
      //   value: 0.1,
      //   name: "backgroundGridSize",
      // }),
      // new RangeMetaParameter({
      //   title: "backgroundGridBorderWidth",
      //   min: 0.01,
      //   max: 100,
      //   step: 0.01,
      //   value: 0.05,
      //   name: "backgroundGridBorderWidth",
      // }),
      // new RangeMetaParameter({
      //   title: "backgroundGridOmitChance",
      //   min: 0.01,
      //   max: 1,
      //   step: 0.01,
      //   value: 0.05,
      //   name: "backgroundGridOmitChance",
      // }),
    ];
  }
}
