import * as _ from "lodash";

import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import {
  BeltHoleRadius,
  makeEvenlySpacedBolts,
  RivetRadius,
} from "../design-utils";

export class StraightCollarOuter extends OuterPaperModelMaker {
  get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Height",
        min: 1,
        max: 5,
        value: 2,
        step: 0.25,
        name: "height",
      }),
      new RangeMetaParameter({
        title: "Neck Size",
        min: 8,
        max: 18,
        value: 13,
        step: 0.1,
        name: "neckSize",
      }),
    ];
  }

  public controlInfo =
    "Measure your neck with a sewing tape measure.<br/>If you don't have one handy, 13.5 inches is usually a good size for a cis woman, and 15 inches for a cis man. Don't worry, this pattern generates extra length.<br/>Note that a straight collar taller than about 2 inches will not be very comfortable.";
  constructor(public subModel: any) {
    super();
  }

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const { height, neckSize } = options[this.constructor.name];

    // quarter inch, two bolts
    // quarter inch, two bolts
    // quarter inch, inch long slot
    // quarter inch, two bolts,
    // quarter inch, two bolts
    // start safe area
    // go for length - belt area - 3 inches
    // 3 inches of holes every 0.5 inches

    const numHoles = 6;
    const holeDistance = 0.5;
    const endPadding = 0.5;
    const holesAreaLength =
      numHoles * holeDistance + endPadding - BeltHoleRadius * 2;

    const distanceToFirstBolts = 0.5;
    const distanceBetweenBolts = 0.378;
    const slotHeight = 0.125;
    const slotPadding = 0.5;
    const slotLength = 0.75;

    const collarPadding = 4;
    const totalLength = neckSize + collarPadding;

    const models: {
      firstBolts?: paper.Path.Circle[];
      secondBolts?: paper.Path.Circle[];
      thirdBolts?: paper.Path.Circle[];
      fourthBolts?: paper.Path.Circle[];
      slot?: paper.Path.Rectangle;
      holes?: paper.Path.Circle[];
    } = {};

    let outerModel: paper.PathItem = new paper.Path.Rectangle(
      new paper.Rectangle(0, 0, totalLength, height),
      { height: height / 2, width: height / 2 }
    );

    let curPos = 0;
    function makeTwoHolesAt(distance: number) {
      return makeEvenlySpacedBolts(paper, 2, [distance, 0], [distance, height]);
    }

    function makeTwoHolesAtCurPos() {
      return makeTwoHolesAt(curPos);
    }

    // belt area
    curPos += distanceToFirstBolts;
    models.firstBolts = makeTwoHolesAtCurPos();
    curPos += distanceBetweenBolts;
    models.secondBolts = makeTwoHolesAtCurPos();
    curPos += slotPadding + slotHeight;

    const slotRectangle = new paper.Rectangle(
      new paper.Point(curPos, height / 2 - slotHeight),
      new paper.Point(curPos + slotLength, height / 2 + slotHeight)
    );
    models.slot = new paper.Path.Rectangle(slotRectangle, {
      width: slotHeight,
      height: slotHeight,
    });

    curPos += slotLength + slotPadding;
    models.thirdBolts = makeTwoHolesAtCurPos();
    curPos += distanceBetweenBolts;
    models.fourthBolts = makeTwoHolesAtCurPos();
    curPos += RivetRadius * 2;
    const beltAreaLength = curPos;

    // belt holes

    const holes = [];
    for (let h = 0; h < numHoles; h++) {
      holes.push(
        new paper.Path.Circle(
          new paper.Point(
            totalLength - endPadding - holeDistance * h,
            height / 2
          ),
          BeltHoleRadius
        )
      );
    }
    models.holes = holes;

    const safeAreaPadding = 0.5;
    const safeAreaLength =
      totalLength - beltAreaLength - holesAreaLength - safeAreaPadding * 2;
    const safeArea = new paper.Path.Rectangle(
      new paper.Rectangle(
        beltAreaLength + safeAreaPadding,
        0,
        safeAreaLength,
        height
      )
    );
    safeArea.strokeColor = new paper.Color("green");
    safeArea.strokeWidth = 0.001;
    // safeArea.remove();

    const safeCone = new paper.Path.Rectangle(
      new paper.Rectangle(
        beltAreaLength + safeAreaPadding,
        -height * 2,
        safeAreaLength,
        height * 4
      )
    );

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.height = height;
    innerOptions.width = totalLength;
    innerOptions.boundaryModel = safeArea;
    innerOptions.safeCone = safeCone;
    innerOptions.outerModel = outerModel;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const allHolesAccumulated: Array<
      paper.Path.Circle[] | paper.Path.Rectangle
    > = [];
    _.forEach(models, (v, _k) => {
      if (v) {
        allHolesAccumulated.push(v);
      }
    });
    const allHoles = _.flatten(allHolesAccumulated);

    if (innerDesign.outline) {
      outerModel = outerModel.unite(innerDesign.outline);
    }

    return new CompletedModel({
      outer: outerModel,
      holes: allHoles,
      design: innerDesign.paths,
    });
  }
}
