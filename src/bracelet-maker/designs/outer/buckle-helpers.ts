import { addToDebugLayer } from "../../utils/debug-layers";
import {
  getBounds,
  makeLeftRoundedRect,
  makeRightRoundedRect,
} from "../../utils/paperjs-utils";
import {
  BeltHoleRadius,
  makeEvenlySpacedBolts,
  RivetRadius,
} from "../design-utils";

const EndPadding = 0.5;

export type BuckleHoleStrapParams = {
  paper: paper.PaperScope;
  numHoles?: number;
  holeDistance?: number;
  height: number;
};

export function getBuckleHolesForStrapSide({
  paper,
  numHoles = 6,
  holeDistance = 0.5,
  height,
}: BuckleHoleStrapParams): paper.Path[] {
  const holes = [];
  for (let holeIndex = 0; holeIndex < numHoles; holeIndex++) {
    const hole = new paper.Path.Circle(
      new paper.Point(holeDistance * holeIndex, height / 2),
      BeltHoleRadius
    );
    holes.push(hole);
    addToDebugLayer(paper, "beltHoles", hole);
  }

  return holes;
}

export function makeBuckleStrapForStrapSide(
  params: BuckleHoleStrapParams & {
    offsetX: number;
  }
) {
  const { offsetX } = params;

  const holes = getBuckleHolesForStrapSide(params);
  holes.forEach((h) => h.translate([offsetX, 0]));

  const holeBounds = getBounds(holes).expand(EndPadding, 0);
  addToDebugLayer(params.paper, "holeBounds", holeBounds);

  return { holes, holeBounds };
}

export function makeBuckleStrapForBuckleSide(
  params: BuckleHoleStrapParams & {
    translate?: paper.PointLike;
  }
) {
  const { paper, height, translate = [0, 0] } = params;

  // quarter inch, two bolts
  // quarter inch, two bolts
  // quarter inch, inch long slot
  // quarter inch, two bolts,
  // quarter inch, two bolts
  // start safe area
  // go for length - belt area - 3 inches
  // 3 inches of holes every 0.5 inches

  const distanceToFirstBolts = 0.5;
  const distanceBetweenBolts = 0.378;
  const slotHeight = 0.125;
  const slotPadding = 0.5;
  const slotLength = 0.75;

  const allHoles: paper.Path[][] = [];

  let curPos = 0;
  function makeTwoHolesAt(distance: number) {
    return makeEvenlySpacedBolts(paper, 2, [distance, 0], [distance, height]);
  }

  function makeTwoHolesAtCurPos() {
    return makeTwoHolesAt(curPos);
  }

  // belt area
  curPos += distanceToFirstBolts;
  allHoles.push(makeTwoHolesAtCurPos());
  curPos += distanceBetweenBolts;
  allHoles.push(makeTwoHolesAtCurPos());
  curPos += slotPadding + slotHeight;

  const slotRectangle = new paper.Rectangle(
    new paper.Point(curPos, height / 2 - slotHeight),
    new paper.Point(curPos + slotLength, height / 2 + slotHeight)
  );

  const slot = new paper.Path.Rectangle(slotRectangle, {
    width: slotHeight,
    height: slotHeight,
  });

  allHoles.push([slot]);

  curPos += slotLength + slotPadding;
  allHoles.push(makeTwoHolesAtCurPos());
  curPos += distanceBetweenBolts;
  allHoles.push(makeTwoHolesAtCurPos());
  curPos += RivetRadius * 2;

  const holes = allHoles.flat();
  holes.forEach((h) => h.translate(translate));

  const holeBounds = getBounds(holes).expand(EndPadding * 2, 0);
  addToDebugLayer(params.paper, "holeBounds", holeBounds);

  return { holes, holeBounds };
}

export function makeLeftBuckle(params: BuckleHoleStrapParams) {
  const { paper, height } = params;
  const { holes: buckleHoles, holeBounds: buckleHoleBounds } =
    makeBuckleStrapForBuckleSide({
      paper,
      height: height,
    });

  const buckle = makeLeftRoundedRect(
    new paper.Rectangle(0, 0, buckleHoleBounds.width, height)
  );

  return { buckle, holes: buckleHoles };
}

export function makeRightBuckle(params: BuckleHoleStrapParams) {
  const { paper, height, numHoles } = params;
  const { holes: buckleHoles, holeBounds: buckleHoleBounds } =
    makeBuckleStrapForStrapSide({
      numHoles,
      paper,
      height: height,
      offsetX: EndPadding,
    });

  const buckle = makeRightRoundedRect(
    new paper.Rectangle(0, 0, buckleHoleBounds.width + EndPadding, height)
  );

  return { buckle, holes: buckleHoles };
}
