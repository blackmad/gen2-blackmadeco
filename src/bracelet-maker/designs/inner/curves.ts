import { addToDebugLayer } from "../../utils/debug-layers";
import { FastAbstractInnerDesign } from "./fast-abstract-inner-design";

function generateRandomCurveInBox({
  paper,
  box,
  rng,
  simplex,
}: {
  paper: paper.PaperScope;
  box: paper.Rectangle;
  rng: () => number;
  simplex: (x: number, y: number) => number;
}): paper.Path {
  const rect = new paper.Path.Rectangle(box);

  // pick a random starting point on the rectangle
  const startingPoint = new paper.Point(
    Math.round(rng()) * box.width,
    rng() * box.height
  );
  rect.getPointAt(rng() * rect.length);

  // TODO: make sure ending point is not same side
  const endingPoint = new paper.Point(
    rng() * box.width,
    Math.round(rng()) * box.height
  );

  console.log({ startingPoint, endingPoint });

  const line = new paper.Path.Line(startingPoint, endingPoint);

  const lineAngle = startingPoint.getAngle(endingPoint);

  const lineAngleManual =
    Math.atan2(
      endingPoint.y - startingPoint.y,
      endingPoint.x - startingPoint.x
    ) *
    (180 / Math.PI);

  const wavyLinePoints = generateWavyLine({
    paper,
    box,
    length: line.length,
    simplex,
  });

  addToDebugLayer(paper, "line", line);
  addToDebugLayer(paper, "wavyLine", new paper.Path(wavyLinePoints));

  const wavyLine = new paper.Path(wavyLinePoints);
  wavyLine.scale(line.length / wavyLine.bounds.width, 1);
  wavyLine.translate(startingPoint.subtract(wavyLine.bounds.topLeft));
  wavyLine.rotate(lineAngleManual, startingPoint);
  wavyLine.bounds.center = line.bounds.center;

  return wavyLine;
}

function scaleRandomToRange(value: number, min: number, max: number) {
  return value * (max - min) + min;
}

function generateWavyLine({
  paper,
  box,
  length,
  simplex,
}: {
  paper: paper.PaperScope;
  box: paper.Rectangle;
  length: number;
  simplex: (x: number, y: number) => number;
}) {
  const points = [];

  console.log(length);
  const numStops = 10;

  // Do a random walk from starting point to ending point
  let currentX = 0;
  for (let i = 0; i < numStops; i++) {
    const currentPoint = new paper.Point(
      currentX,
      simplex(0, i * 0.1) * box.height * 0.1
    );
    currentX +=
      (length / numStops) * scaleRandomToRange(simplex(i, 0), 0.75, 1.25);
    points.push(currentPoint);
  }

  return points;
}

export class InnerDesignCurves extends FastAbstractInnerDesign {
  async makeDesign(paper: paper.PaperScope, params: any) {
    const {
      numPoints,
      shearY,
      xOffset,
      yOffset,
      borderWidth,
      seedPointLineShrink,
      seedShapeSides,
      minSpokeLength,
    } = params;
    const boundaryModel: paper.Path = params.boundaryModel;
    addToDebugLayer(paper, "boundaryModel", boundaryModel);

    const numLines = 40;

    for (let i = 0; i < numLines; i++) {
      const curve1 = generateRandomCurveInBox({
        paper,
        box: boundaryModel.bounds,
        rng: this.rng,
        simplex: this.simplex,
      });

      curve1.smooth({ type: "catmull-rom", factor: 1 });
      addToDebugLayer(paper, "curve1", curve1);
    }

    return { paths: [] };
  }

  get designMetaParameters() {
    return [];
  }
}
