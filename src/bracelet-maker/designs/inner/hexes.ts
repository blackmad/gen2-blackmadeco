import { RangeMetaParameter } from "../../meta-parameter";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

export class InnerDesignHexes extends FastAbstractInnerDesign {
  allowOutline = true;
  needSubtraction = false;
  requiresSafeConeClamp = false;
  needSeed = false;
  canRound = false;

  makeDesign(paper: paper.PaperScope, params: any) {
    const { boundaryModel, numRows, stretchWidth } = params;

    const height = boundaryModel.bounds.height;
    const rowHeight = height / numRows;
    const hexSize = rowHeight * 0.5;
    const hexWidth = rowHeight * stretchWidth;

    const numHexes = Math.round(
      boundaryModel.bounds.width / (hexSize * 2 * stretchWidth)
    );

    const paths = [];

    const startRow = 0;
    const endRow = numRows;

    const startX = boundaryModel.bounds.x;
    const startY = boundaryModel.bounds.y + rowHeight / 2;

    for (let r = startRow; r < endRow; r++) {
      const offset = r % 2 ? 0.5 : 1;

      const startColumn = 0;
      const columnsForThisRow = numHexes - offset;

      for (let c = 0; c < columnsForThisRow; c += 1) {
        const centerX = startX + (c + offset) * hexWidth;
        if (
          centerX - hexSize / 2 < startX ||
          centerX + hexSize / 2 > startX + boundaryModel.bounds.width - 0.02
        ) {
          continue;
        }
        const hex = new paper.Path.RegularPolygon(
          new paper.Point(centerX, startY + r * rowHeight),
          6,
          hexSize
        );

        paths.push(hex);

        if (stretchWidth != 1) {
          hex.scale(stretchWidth, 1);
        }
      }
    }

    // const minX = _.min(_.map(paths, (p) => p.bounds.x));
    // const maxX = _.max(_.map(paths, (p) => p.bounds.x));
    // const usedX = maxX - minX;
    // const whitespace = boundaryModel.bounds.width - usedX;
    // console.log(minX, maxX, usedX, whitespace);
    // paths.forEach(p => new paper.Point(p.translate(whitespace/4, 0)))

    return Promise.resolve({ paths: paths });
  }

  get designMetaParameters() {
    return [
      new RangeMetaParameter({
        title: "Rows",
        min: 3,
        max: 10,
        value: 5,
        step: 1,
        name: "numRows",
      }),
      new RangeMetaParameter({
        title: "stretchWidth",
        min: 0.5,
        max: 3,
        value: 1.5,
        step: 0.01,
        name: "stretchWidth",
      }),
    ];
  }
}
