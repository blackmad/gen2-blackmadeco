export function phyllotaxisPoints({
  paper,
  boundaryModel,
  numDots,
  angle,
  scalingParam,
}: {
  paper: paper.PaperScope;
  boundaryModel: paper.Path;
  numDots: number;
  angle: number;
  scalingParam: number;
}) {
  function deg2rad(d: number) {
    return (d * Math.PI) / 180;
  }

  const points: paper.Point[] = [];

  for (let n = 1; n < numDots; n++) {
    const theta = n * angle;
    const r = scalingParam * Math.sqrt(n);

    const point = new paper.Point(
      boundaryModel.bounds.center.x + r * Math.cos(deg2rad(theta)),
      boundaryModel.bounds.center.y + r * Math.sin(deg2rad(theta))
    );
    points.push(point);
  }

  return points;
}
