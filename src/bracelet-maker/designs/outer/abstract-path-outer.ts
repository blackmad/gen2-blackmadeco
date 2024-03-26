import {
  MetaParameter,
  OnOffMetaParameter,
  RangeMetaParameter,
  SelectMetaParameter,
} from "../../meta-parameter";
import { CompletedModel, OuterPaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import { roundCorners } from "../../utils/round-corners";

export abstract class AbstractPathOuter extends OuterPaperModelMaker {
  public get outerMetaParameters(): MetaParameter<any>[] {
    return [
      new RangeMetaParameter({
        title: "Height",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "height",
      }),
      new RangeMetaParameter({
        title: "Width",
        min: 0.1,
        max: 20,
        value: 3,
        step: 0.01,
        name: "width",
      }),
      new OnOffMetaParameter({
        title: "Round Corners",
        value: true,
        name: "shouldRoundCorners",
      }),
      new OnOffMetaParameter({
        title: "Earring Hole",
        value: true,
        name: "earringHole",
      }),
      new SelectMetaParameter({
        title: "Earring Hole Position",
        options: ["Outside", "Inside"],
        value: "Outside",
        name: "earringHolePosition",
      }),
      new RangeMetaParameter({
        title: "Earring Hole Inner Size",
        min: 0.1,
        max: 20,
        value: 0.04,
        step: 0.01,
        name: "earringHoleInnerSize",
      }),
      // new OnOff({
      //   title: "Width",
      //   min: 0.1,
      //   max: 20,
      //   value: 3,
      //   step: 0.01,
      //   name: "width",
      // }),
    ];
  }

  constructor(public subModel: any) {
    super();
  }

  abstract makeOuterModel(paper: paper.PaperScope, params: any): paper.PathItem;

  public async make(paper: paper.PaperScope, options): Promise<CompletedModel> {
    const params = options[this.constructor.name];
    const { shouldRoundCorners } = params;

    let outerModel = this.makeOuterModel(paper, params);
    outerModel = shouldRoundCorners
      ? roundCorners({ paper, path: outerModel, radius: 0.1 })
      : outerModel;

    const innerOptions = options[this.subModel.constructor.name] || {};
    innerOptions.safeCone = outerModel.clone().scale(5, 5);
    innerOptions.outerModel = outerModel;

    // TODO awful awful awful fix
    this.subModel.scaleWidthForSafeArea = true;

    const innerDesign = await this.subModel.make(paper, innerOptions);

    const { earringHole, earringHoleInnerSize, earringHolePosition } = params;
    if (earringHole) {
      const innerCircle = new paper.Path.Circle({
        center: outerModel.bounds.center,
        radius: earringHoleInnerSize,
      });
      const outerCircle = new paper.Path.Circle({
        center: outerModel.bounds.center,
        radius: earringHoleInnerSize * 2,
      });
      const earringHole = new paper.CompoundPath([outerCircle, innerCircle]);

      // find the middle intersection point
      const middleLine = new paper.Path.Line(
        outerModel.bounds.topCenter,
        outerModel.bounds.bottomCenter
      );
      const middleIntersection =
        outerModel.getIntersections(middleLine)[0].point;

      // move the earring hole to the middle intersection point
      earringHole.position = middleIntersection;
      addToDebugLayer(paper, "earringHole", earringHole);
    }

    const finalOuterModel = innerDesign.outline
      ? outerModel.unite(innerDesign.outline)
      : outerModel;

    return new CompletedModel({
      outer: finalOuterModel,
      holes: [],
      design: innerDesign.paths,
    });
  }
}
