import * as _ from "lodash";
import ExtendPaperJs from "paperjs-offset";
import seedrandom from "seedrandom";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";

import {
  MetaParameter,
  OnOffMetaParameter,
  RangeMetaParameter,
} from "../../meta-parameter";
import { InnerCompletedModel, PaperModelMaker } from "../../model-maker";
import { addToDebugLayer } from "../../utils/debug-layers";
import { makeConcaveOutline } from "../../utils/outline";
import {
  bufferPath,
  simplifyPath,
  unkinkPath,
} from "../../utils/paperjs-utils";
import { removeBadSegments } from "../../utils/remove-bad-segments";
import { roundCorners } from "../../utils/round-corners";
import {
  KaleidoscopeMaker,
  KaleidoscopeMakerParams,
} from "./utils/kaleidosope";

export interface InnerDesignModel {
  paths: paper.PathItem[];
  outlinePaths?: paper.PathItem[];
}

export abstract class FastAbstractInnerDesign implements PaperModelMaker {
  public rng: () => number = () => {
    throw new Error("rng not initialized");
  };
  public simplex: NoiseFunction2D = () => {
    throw new Error("simplex not initialized");
  };
  public needSubtraction: boolean = true;
  public allowOutline: boolean = false;
  public smoothOutline: boolean = true;
  public requiresSafeConeClamp: boolean = true;
  public forceContainmentDefault: boolean = true;
  public needSeed: boolean = true;
  public canRound: boolean = false;
  public canKaleido: boolean = false;
  public defaultKaleido: boolean = false;
  public scaleHeightForSafeArea = true;
  public scaleWidthForSafeArea = false;

  public controlInfo = "";

  public abstract makeDesign(
    scope: paper.PaperScope,
    params: any
  ): Promise<InnerDesignModel>;
  abstract get designMetaParameters(): MetaParameter<any>[];

  public get metaParameters() {
    let metaParams: MetaParameter<any>[] = [
      new OnOffMetaParameter({
        title: "Debug",
        name: "debug",
        value: false,
      }),
      new RangeMetaParameter({
        title: "Safe Border (in)",
        min: 0.0,
        max: 0.75,
        value: 0.25,
        step: 0.01,
        name: "safeBorderWidth",
        shouldDisplay: (p: { breakThePlane: boolean }) => !p.breakThePlane,
      }),
    ];

    if (this.needSeed) {
      metaParams.push(
        new RangeMetaParameter({
          title: "Seed",
          min: 1,
          max: 10000,
          randMin: 1,
          randMax: 10000,
          value: 1,
          step: 1,
          name: "seed",
        })
      );
    }

    metaParams = metaParams.concat(this.designMetaParameters);

    if (this.canKaleido) {
      KaleidoscopeMaker.designMetaParameters(this.defaultKaleido).forEach((m) =>
        metaParams.push(m)
      );
    }

    if (this.canRound) {
      metaParams.push(
        new OnOffMetaParameter({
          title: "Round paths",
          value: true,
          name: "shouldSmooth",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Smoothing Factor",
          min: 0.01,
          max: 1.0,
          value: 0.8,
          step: 0.01,
          name: "smoothingFactor",
        })
      );
    }

    if (this.allowOutline) {
      const breakThePlane = new OnOffMetaParameter({
        title: "Break the plane!!!!",
        name: "breakThePlane",
        value: false,
        group: "Break the plane!!!!",
      });

      metaParams.push(breakThePlane);
      metaParams.push(
        new RangeMetaParameter({
          title: "Extend outward (in)",
          min: 0.1,
          max: 2.0,
          value: 0.25,
          step: 0.01,
          name: "extendOutward",
          parentParam: breakThePlane,
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Outline Concavity",
          min: 0.1,
          max: 3,
          value: 0.4,
          step: 0.01,
          name: "concavity",
          parentParam: breakThePlane,
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Outline Length Threshold",
          min: 0.01,
          max: 3,
          value: 0.25,
          step: 0.01,
          name: "lengthThreshold",
          parentParam: breakThePlane,
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Outline Size (inches)",
          min: 0.01,
          max: 3,
          value: 0.15,
          step: 0.01,
          name: "outlineSize",
          parentParam: breakThePlane,
        })
      );
      // metaParams.push(
      //   new OnOffMetaParameter({
      //     title: 'Smooth Outline',
      //     name: 'smoothOutline',
      //     value: false
      //   })
      // );
    }

    return metaParams;
  }

  private initRNGs(params: { seed: string | number | undefined }) {
    const seed = params.seed ?? new Date();
    this.rng = seedrandom(seed.toString());

    const noiseRng = seedrandom(seed.toString());

    // use the seeded random function to initialize the noise function
    this.simplex = createNoise2D(noiseRng);
  }

  private maybeSmooth(
    paper: paper.PaperScope,
    params: any,
    paths: paper.PathItem[]
  ) {
    if (params.shouldSmooth) {
      return paths.map((path) => {
        addToDebugLayer(paper, "holes", path);
        return roundCorners({
          paper,
          path: path,
          radius: params.smoothingFactor,
        });
      });
    }
    return paths;
  }

  private clampPathsToBoundary(
    paths: paper.PathItem[],
    boundary: paper.PathItem
  ) {
    return paths.map((m) => {
      return m.intersect(boundary, { insert: false });
    });
  }

  private makeOutline(
    paper: paper.PaperScope,
    params: any,
    paths: paper.PathItem[],
    originalBoundaryModel: paper.PathItem
  ) {
    console.log("need to make outline");
    // Make the outline
    let outline = makeConcaveOutline({
      paper,
      paths,
      concavity: params.concavity,
      lengthThreshold: params.lengthThreshold,
      minimumOutline: originalBoundaryModel.bounds,
    });

    // Expand it to our outline border
    outline = (paper.Path.prototype as any).offset.call(
      outline,
      -params.outlineSize,
      {
        cap: "miter",
      }
    );
    addToDebugLayer(paper, "expandedOutline", outline.clone());

    // If we ended up with an outline that's a compound path,
    // just take the child path that's the biggest
    if (outline instanceof paper.CompoundPath) {
      outline = _.sortBy(
        outline.children,
        (c: paper.Path) => -c.area
      )[0] as paper.Path;
    }

    console.log("about to unkink expanded outline", { outline });

    removeBadSegments({ paper, path: outline });

    outline = simplifyPath(paper, outline, 0.05);

    outline = unkinkPath(paper, outline);

    removeBadSegments({ paper, path: outline });

    outline = roundCorners({
      paper,
      path: outline,
      radius: 0.5,
    });

    // outline.smooth();

    addToDebugLayer(paper, "unkinkedexpandedOutline", outline.clone());

    console.log(outline.exportSVG({ asString: true }));

    outline.closePath();
    // outline = roundCorners({ paper, path: outline, radius: 0.9 });

    return outline;

    // This logic is supposed to be for if we have a design that feeds us circles or curves
    // point sampling concave outline isn't going to give us nice curves
    // but I don't have a great way right now to detect if I want that logic - like
    // I probably don't want to do this version for rounded shapes?
    // } else {
    //   paths.map(p => {
    //     const exploded = paper.Path.prototype.offset.call(
    //       p,
    //       params.outlineSize,
    //       { cap: "miter" }
    //     );
    //     outline = outline.unite(exploded);
    //   });
    // }
  }

  private maybeMakeOutline(
    paper: paper.PaperScope,
    params: any,
    _paths: paper.PathItem[],
    design: InnerDesignModel,
    originalBoundaryModel: paper.PathItem
  ) {
    let outline: paper.PathItem | null = null;
    const paths: paper.PathItem[] = _paths;

    const shouldMakeOutline = params.breakThePlane;

    // if (this.allowOutline && shouldMakeOutline) {
    //   const outline = (paper.Path.prototype as any).offset.call(params.boundaryModel, params.outlineSize, {
    //     cap: "miter"
    //   });
    //   return {outline, paths};
    // }

    if (this.allowOutline && shouldMakeOutline) {
      addToDebugLayer(paper, "safeCone", params.safeCone);

      if (design.outlinePaths) {
        console.log("but using outline paths");
        // if an inner design has been nice to us by making its own outline, just use that
        let outlinePaths = design.outlinePaths;
        if (this.requiresSafeConeClamp) {
          outlinePaths = this.clampPathsToBoundary(
            outlinePaths,
            params.safeCone
          );
        }
        outline = new paper.CompoundPath(outlinePaths);
      } else {
        ExtendPaperJs(paper);

        // only look at paths that are inside or touching the model to make into the outline
        // and to use for the final design
        // Otherwise our inner design might have made shapes that are well outside the primary area
        // and not connected to anything
        // note that we could also include EVERYTHING but this version tends to lead to more interesting outlines
        // also maybe we can't because turning this off breaks things?
        // paths = paths.filter(p =>
        //   // p.intersects(params.outerModel)
        //   containsOrIntersects({ needle: p, haystack: params.outerModel })
        // );

        outline = this.makeOutline(paper, params, paths, originalBoundaryModel);
      }
    }
    return { outline, paths };
  }

  public make = async (
    paper: paper.PaperScope,
    params: {
      segments: number;
      boundaryModel: paper.PathItem;
      seed: string | number | undefined;
      safeCone: paper.PathItem;
      outerModel: paper.PathItem;
      breakThePlane: boolean;
      extendOutward: number;
      safeBorderWidth: number;
    } & KaleidoscopeMakerParams
  ): Promise<InnerCompletedModel> => {
    // const self = this;

    this.initRNGs(params);

    addToDebugLayer(paper, "boundaryModel", params.boundaryModel.clone());

    addToDebugLayer(paper, "safeCone", params.safeCone.clone());

    const originalBoundaryModel = params.boundaryModel.clone();

    if (params.breakThePlane) {
      params.boundaryModel = bufferPath(
        paper,
        params.extendOutward,
        params.boundaryModel
      );
      params.boundaryModel = params.boundaryModel.intersect(params.safeCone, {
        insert: false,
      });
    } else {
      const originalHeight = params.boundaryModel.bounds.height;
      const heightScale = this.scaleHeightForSafeArea
        ? params.safeBorderWidth / originalHeight
        : 0;

      const originalWidth = params.boundaryModel.bounds.width;
      const widthScale = this.scaleWidthForSafeArea
        ? params.safeBorderWidth / originalWidth
        : 0;
      // params.boundaryModel.scale(new paper.Point(1, 1 - heightScale));
      params.boundaryModel.scale(1 - widthScale, 1 - heightScale);
    }

    let kaleidoscopeMaker: KaleidoscopeMaker | null = null;
    let kaleidoscopeSavedBoundaryModel: paper.PathItem | null = null;

    if (this.canKaleido && params.segments > 1) {
      kaleidoscopeMaker = new KaleidoscopeMaker(paper, params);
      kaleidoscopeSavedBoundaryModel = params.boundaryModel.clone();
      params.boundaryModel = kaleidoscopeMaker.getBoundarySegment();
      params.boundaryModel = params.boundaryModel.intersect(params.safeCone, {
        insert: false,
      });
    }

    addToDebugLayer(
      paper,
      "modified boundaryModel",
      params.boundaryModel.clone()
    );

    const design = await this.makeDesign(paper, params);

    // filter out possibly null paths for ease of designs
    let paths = design.paths
      .filter((p) => !!p)
      .filter((p) => p.bounds.area !== 0);

    // explode compound paths to make everything easier
    paths = paths.flatMap((path) => {
      if (path instanceof paper.CompoundPath) {
        return path.children as paper.PathItem[];
      } else {
        return [path];
      }
    });

    if (kaleidoscopeMaker && kaleidoscopeSavedBoundaryModel) {
      params.boundaryModel = kaleidoscopeSavedBoundaryModel;
      console.log("putting back boundary for kaleido / reflecting paths");
      paths = kaleidoscopeMaker.reflectPaths(paths);
      console.log("done reflecting paths");
    }

    // maybe smooth paths
    paths = this.maybeSmooth(paper, params, paths);

    const shouldMakeOutline =
      params.boundaryModel.bounds.height > params.outerModel.bounds.height;
    if ((this.needSubtraction || kaleidoscopeMaker) && !shouldMakeOutline) {
      console.log("clamping to boundary");
      paths = this.clampPathsToBoundary(paths, params.boundaryModel);
    }

    if (this.requiresSafeConeClamp) {
      console.log("clamping to cone");
      paths = this.clampPathsToBoundary(paths, params.safeCone);
    }

    const maybeOutline = this.maybeMakeOutline(
      paper,
      params,
      paths,
      design,
      originalBoundaryModel
    );
    paths = maybeOutline.paths;
    const outline = maybeOutline.outline;
    console.log({ outline });

    return new InnerCompletedModel({
      paths,
      outline,
    });
  };

  randomElement<T>(items: T[]): T {
    return items[Math.floor(this.rng() * items.length)];
  }
}
