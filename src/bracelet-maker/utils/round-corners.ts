export function roundCorners({
  paper,
  path,
  radius,
}: {
  paper: paper.PaperScope;
  path: paper.Item;
  radius: number;
}): paper.Item {
  if (path instanceof paper.CompoundPath) {
    return new paper.CompoundPath(
      path.children.flatMap((child) => {
        if (child instanceof paper.Path) {
          return [roundCornersHelper({ paper, path: child, radius })];
        }
        return [];
      })
    );
  } else if (path instanceof paper.Path) {
    return roundCornersHelper({ paper, path, radius });
  } else {
    console.log("unknown path type");
    return path;
  }
}

export function roundCornersHelper({
  paper,
  path,
  radius,
}: {
  paper: paper.PaperScope;
  path: paper.Path;
  radius: number;
}) {
  if (!path || !path.segments || path.segments.length < 3) {
    // console.log("can't round", {path})
    return path;
  }

  path.closePath();

  const segments = path.segments.slice(0);
  path.removeSegments();

  for (let i = 0, l = segments.length; i < l; i++) {
    const curPoint = segments[i].point;
    const nextPoint = segments[i + 1 == l ? 0 : i + 1].point;
    const prevPoint = segments[i - 1 < 0 ? segments.length - 1 : i - 1].point;
    const nextDelta = curPoint.subtract(nextPoint);
    const prevDelta = curPoint.subtract(prevPoint);

    const actualRadius =
      Math.min(nextDelta.length, prevDelta.length) * (radius / 2);

    nextDelta.length = actualRadius;
    prevDelta.length = actualRadius;

    path.add(
      new paper.Segment(curPoint.subtract(prevDelta), null, prevDelta.divide(2))
    );

    path.add(
      new paper.Segment(curPoint.subtract(nextDelta), nextDelta.divide(2), null)
    );
  }
  path.closed = true;
  return path;
}
