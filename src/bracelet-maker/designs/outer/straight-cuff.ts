import { MetaParameter, RangeMetaParameter } from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { makeEvenlySpacedBolts, RivetRadius } from "../design-utils";

function roundCorners({
  paper,
  path,
  radius,
}: {
  paper: paper.PaperScope;
  path: paper.Path;
  radius: number;
}) {
  const segments = path.segments.slice(0);
  path.removeSegments();

  for (let i = 0, l = segments.length; i < l; i++) {
    const segment = segments[i];
    if (segment.isSmooth()) {
      continue;
    }

    const curPoint = segments[i].point;
    const nextPoint = segments[i + 1 == l ? 0 : i + 1].point;
    const prevPoint = segments[i - 1 < 0 ? segments.length - 1 : i - 1].point;
    const nextDelta = curPoint.subtract(nextPoint);
    const prevDelta = curPoint.subtract(prevPoint);

    nextDelta.length = radius;
    prevDelta.length = radius;

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

export class StraightCuffOuter extends OuterPaperModelMaker {
  public bottomPadding = 0.0;
  public topPadding = 0.0;

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
        title: "Wrist Circumference",
        min: 4,
        max: 10,
        value: 7.5,
        step: 0.1,
        name: "wristCircumference",
      }),
      new RangeMetaParameter({
        title: "Wide Wrist Circumference Per Inch Multiplier",
        min: 4,
        max: 10,
        value: 0.25,
        step: 0.1,
        name: "wideWristCircumferencePerInchMultiplier",
      }),
    ];
  }

  public controlInfo = `Measure your wrist with a sewing measuring tape. I suggest measuring pretty tight, this pattern adds some length.<br/>
  Cis male wrists average around 7 inches, cis female wrists closer to 6.5 inches." `;

  constructor(public subModel: any) {
    super();
  }

  public makeHoles({
    paper,
    height,
    maxWidth,
    widthDiff,
    insetWidth,
  }): paper.Path.Circle[] {
    const guideLineLeftP1 = new paper.Point(insetWidth - RivetRadius / 2, 0);
    const guideLineLeftP2 = new paper.Point(
      insetWidth + widthDiff - RivetRadius / 2,
      height
    );

    let numBolts = Math.round(height);
    if (height > 1.5) {
      numBolts = Math.max(2, numBolts);
    }

    const holes1 = makeEvenlySpacedBolts(
      paper,
      numBolts,
      guideLineLeftP1,
      guideLineLeftP2
    );

    const guideLineRightP1 = new paper.Point(
      maxWidth - insetWidth + RivetRadius / 2,
      0
    );
    const guideLineRightP2 = new paper.Point(
      maxWidth - insetWidth - widthDiff + RivetRadius / 2,
      height
    );

    const holes2 = makeEvenlySpacedBolts(
      paper,
      numBolts,
      guideLineRightP1,
      guideLineRightP2
    );

    return [...holes1, ...holes2];
  }

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const {
      wristCircumference,
      height,
      wideWristCircumferencePerInchMultiplier,
    } = options.StraightCuffOuter;

    const forearmCircumference =
      wideWristCircumferencePerInchMultiplier * height + wristCircumference;

    const gutterWidth = 0.8;

    const minWidth = wristCircumference + gutterWidth;
    const maxWidth = forearmCircumference + gutterWidth;
    const widthDiff = (maxWidth - minWidth) / 2;

    let cuffOuter: paper.Path = new paper.Path();
    cuffOuter.strokeColor = new paper.Color("black");
    cuffOuter.add(new paper.Point(0, 0));
    cuffOuter.add(new paper.Point(widthDiff, height));
    cuffOuter.add(new paper.Point(minWidth + widthDiff, height));
    cuffOuter.add(new paper.Point(maxWidth, 0));
    roundCorners({ paper, path: cuffOuter, radius: "0.2" });
    const holes = this.makeHoles({
      paper: paper,
      maxWidth,
      widthDiff,
      insetWidth: gutterWidth / 2,
      height,
    });

    const safeAreaPath: paper.Path = new paper.Path();
    // TODO: undo maybe
    // safeAreaPath.add(new paper.Point(gutterWidth / 2, 0));
    // safeAreaPath.add(new paper.Point(gutterWidth / 2 + widthDiff, height));
    // safeAreaPath.add(new paper.Point(minWidth - gutterWidth / 2, height));
    // safeAreaPath.add(new paper.Point(maxWidth - gutterWidth / 2, 0));
    safeAreaPath.add(new paper.Point(gutterWidth, 0));
    safeAreaPath.add(new paper.Point(gutterWidth + widthDiff, height));
    safeAreaPath.add(new paper.Point(minWidth - gutterWidth, height));
    safeAreaPath.add(new paper.Point(maxWidth - gutterWidth, 0));
    roundCorners({ paper, path: safeAreaPath, radius: "0.2" });

    const halfSafeConeAngle = Math.atan(widthDiff / height);
    const safeConeExtraHeight = 5;
    const safeConeExtraWidth =
      Math.tan(halfSafeConeAngle) * safeConeExtraHeight;
    const convergeHeight = wristCircumference / 2 / Math.tan(halfSafeConeAngle);
    const safeCone: paper.Path = new paper.Path();

    safeCone.add(
      new paper.Point(gutterWidth - safeConeExtraWidth, -safeConeExtraHeight)
    );
    safeCone.add(
      new paper.Point(
        forearmCircumference + safeConeExtraWidth,
        -safeConeExtraHeight
      )
    );
    safeCone.add(new paper.Point(maxWidth / 2, height + convergeHeight));
    safeCone.closePath();

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = safeCone;
    innerOptions.outerModel = cuffOuter;

    const innerDesign = await this.subModel.make(paper, innerOptions);
    if (innerDesign.outline) {
      cuffOuter = cuffOuter.unite(innerDesign.outline) as paper.Path;
    }

    return new CompletedModel({
      outer: cuffOuter,
      holes: holes,
      design: innerDesign.paths,
    });
  }
}
