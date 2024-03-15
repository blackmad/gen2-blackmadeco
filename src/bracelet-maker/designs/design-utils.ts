import * as _ from 'lodash';

export const MillimeterToInches = 0.0393701;
export const RivetRadius = 2.5 * MillimeterToInches;
export const BeltHoleRadius = 3 * MillimeterToInches;

export function makeEvenlySpacedBolts(paper, numBolts, p1, p2) {
  let line = new paper.Path.Line(p1, p2);

	const circles = [];
  _.times(numBolts * 3, boltNum => {
    if ((boltNum - 1) % 3 == 0) {
      const center = line.getPointAt(
        (line.length * (boltNum + 1)) / (numBolts * 3 + 1)
      );
      const circle = new paper.Path.Circle(center, RivetRadius);
      circles.push(circle);
    }
  });

  return circles;
}

export function makeAndAddEvenlySpacedBolts({ paper, numBolts, p1, p2, path }) {
  makeEvenlySpacedBolts(paper, numBolts, p1, p2).forEach(p => path.addChild(p));
}
