import LSystem from "lindenmayer";

export type BasicLSystemArgs = {
  paper: paper.PaperScope;
  bounds: paper.Rectangle;
  numDots: number;
  numIterations: number;
  plusAngle: number;
  minusAngle: number;
};

const basicLSystem = ({
  paper,
  bounds,
  numIterations,
  plusAngle,
  minusAngle,
  axiom,
  productions,
}: BasicLSystemArgs & {
  axiom: typeof LSystem.prototype.axiom;
  productions: typeof LSystem.prototype.productions;
}) => {
  const points: paper.PointLike[] = [];
  const lines: paper.Path.Line[] = [];
  let currentPoint = new paper.Point(bounds.x, bounds.y);
  points.push(currentPoint);

  let currentAngle = 0;
  const koch = new LSystem({
    axiom,
    productions,
    finals: {
      "+": () => {
        currentAngle += plusAngle;
      },
      "-": () => {
        currentAngle -= minusAngle;
      },
      F: () => {
        // make a new point from currentPoint, via currentAngle of length 40
        currentPoint = currentPoint.add([
          Math.cos((currentAngle * Math.PI) / 180.0) / (koch.iterations + 1),
          Math.sin((currentAngle * Math.PI) / 180.0) / (koch.iterations + 1),
        ]);
        points.push(currentPoint);
        if (points.length > 1) {
          lines.push(
            new paper.Path.Line(points[points.length - 1], currentPoint)
          );
        }
      },
    },
  });

  koch.iterate(numIterations);
  koch.final();

  const fittedPath = new paper.Path(points);
  fittedPath.fitBounds(bounds, true);
  return fittedPath.segments.map((s) => s.point);
};

export function kochSnowflake(params: BasicLSystemArgs) {
  return basicLSystem({
    ...params,
    axiom: "F++F++F",
    productions: { F: "F-F++F-F" },
  });
}

export function kochCurve(params: BasicLSystemArgs) {
  return basicLSystem({
    ...params,
    axiom: "F+F−F−F+F",
    productions: { F: "F+F−F−F+F" },
  });
}

export function sierpinskiTriangle(params: BasicLSystemArgs) {
  return basicLSystem({
    ...params,
    axiom: "F",
    productions: { F: "B−F−B", B: "F+B+F" },
  });
}

export function dragonCurve(params: BasicLSystemArgs) {
  return basicLSystem({
    ...params,
    axiom: "FX",
    productions: { X: "X+YF+", Y: "-FX-Y" },
  });
}

export function penroseTilingRhombus(params: BasicLSystemArgs) {
  return basicLSystem({
    ...params,
    axiom: "[X]++[X]++[X]++[X]++[X]",
    productions: {
      W: "YF++ZF----XF[-YF----WF]++",
      X: "+YF--ZF[---WF--XF]+",
      Y: "-WF++XF[+++YF++ZF]-",
      Z: "--YF++++WF[+ZF++++XF]--XF",
    },
  });
}

export const allLSystems = {
  kochSnowflake,
  kochCurve,
  sierpinskiTriangle,
  dragonCurve,
} as const;
