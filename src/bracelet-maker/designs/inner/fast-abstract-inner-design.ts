import * as _ from "lodash";
import { PaperOffset } from "paperjs-offset";
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
  clampPathsToBoundary,
  isInside,
  makeSymmetric,
  pathItemArea,
} from "../../utils/paperjs-utils";
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
      // new OnOffMetaParameter({
      //   title: "Debug",
      //   name: "debug",
      //   value: false,
      // }),
      new RangeMetaParameter({
        title: "Safe Border (in)",
        min: 0.0,
        max: 0.75,
        value: 0.2,
        step: 0.01,
        name: "safeBorderWidth",
        shouldDisplay: (p: { breakThePlane: boolean }) => !p.breakThePlane,
      }),
      new RangeMetaParameter({
        title: "Minimum Hole Size (in)",
        min: 0.01,
        max: 0.25,
        value: 0.05,
        step: 0.01,
        name: "minimumHoleSize",
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
          value: 0.4,
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
          // parentParam: breakThePlane,
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Outline Concavity",
          min: 1,
          max: 3,
          value: 1,
          step: 0.01,
          name: "concavity",
          // parentParam: breakThePlane,
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
          // parentParam: breakThePlane,
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
          group: "Break the plane!!!!",
          // parentParam: breakThePlane,
        })
      );
      metaParams.push(
        new OnOffMetaParameter({
          title: "Symmetric",
          value: true,
          name: "symmetric",
          group: "Break the plane!!!!",
        })
      );

      metaParams.push(
        new RangeMetaParameter({
          title: "Flatten Outline Tolerance",
          min: 0.0,
          max: 2000,
          value: 0,
          step: 0.5,
          name: "flattenOutlineTolerance",
          group: "Break the plane!!!!",
          // parentParam: breakThePlane,
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Simplfy Outline Tolerance",
          min: 0.0,
          max: 100,
          value: 0,
          step: 0.5,
          name: "simplifyOutlineTolerance",
          group: "Break the plane!!!!",
          // parentParam: breakThePlane,
        })
      );
      metaParams.push(
        new OnOffMetaParameter({
          title: "Shrink-to-fit",
          value: false,
          name: "shrinkToFit",
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new OnOffMetaParameter({
          title: "Ellipse Exapnd",
          value: true,
          name: "ellipseExpand",
          group: "Break the plane!!!!",
        })
      );
      metaParams.push(
        new RangeMetaParameter({
          title: "Percentage Outline Overlap Required",
          min: 0.0,
          max: 100,
          value: 50,
          step: 0.5,
          name: "percentageOutlineOverlapRequired",
          group: "Break the plane!!!!",
          // parentParam: breakThePlane,
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

  private async makeOutline({
    paper,
    params,
    paths,
    originalBoundaryModel,
    safeCone,
    symmetric,
  }: {
    paper: paper.PaperScope;
    params: any;
    paths: paper.PathItem[];
    originalBoundaryModel: paper.PathItem;
    safeCone: paper.PathItem;
    symmetric: boolean;
  }) {
    console.log("need to make outline");

    // Make the outline
    let outline = await makeConcaveOutline({
      paper,
      paths,
      concavity: params.concavity,
      lengthThreshold: params.lengthThreshold,
      minimumOutlinePath: originalBoundaryModel.intersect(safeCone),
      symmetric,
    });

    addToDebugLayer(
      paper,
      "using this originalBoundaryModel",
      originalBoundaryModel.clone()
    );
    // Expand it to our outline border
    outline = PaperOffset.offset(outline, params.outlineSize, {
      // join: "miter",
      // cap: "butt",
      limit: 1,
      // join?: 'miter' | 'bevel' | 'round';
      // the cap style of offset (only validate for offsetStroke), default is 'butt', ('square' will be supported in future)
      // cap?: 'butt' | 'round';
      // the limit for miter style (refer to the miterLimit definition in paper)
      // limit?: number;
    });
    if (params.flattenOutlineTolerance) {
      outline.flatten(params.flattenOutlineTolerance / 1000);
    }

    if (params.simplifyOutlineTolerance) {
      outline.simplify(params.simplifyOutlineTolerance / 2000);
    }

    outline.smooth({ type: "catmull-rom" });

    addToDebugLayer(paper, "expandedOutline", outline.clone());

    if (symmetric) {
      const originalOutline = outline.clone();
      outline = makeSymmetric(paper, outline);
      if (outline.area === 0) {
        outline = originalOutline;
      }
    }

    // If we ended up with an outline that's a compound path,
    // just take the child path that's the biggest
    if (outline instanceof paper.CompoundPath) {
      outline = _.sortBy(
        outline.children,
        (c: paper.Path) => -c.area
      )[0] as paper.Path;
    }

    addToDebugLayer(paper, "unkinkedexpandedOutline", outline.clone());

    return outline;
  }

  private async maybeMakeOutline(
    paper: paper.PaperScope,
    params: any,
    _paths: paper.PathItem[],
    design: InnerDesignModel,
    originalBoundaryModel: paper.PathItem,
    safeCone: paper.PathItem
  ) {
    let outline: paper.PathItem | null = null;
    let paths: paper.PathItem[] = _paths;

    const shouldMakeOutline = params.breakThePlane;

    if (this.allowOutline && shouldMakeOutline) {
      addToDebugLayer(paper, "safeCone", params.safeCone);

      if (design.outlinePaths) {
        console.log("but using outline paths");
        // if an inner design has been nice to us by making its own outline, just use that
        let outlinePaths = design.outlinePaths;
        outlinePaths = clampPathsToBoundary(outlinePaths, params.safeCone);
        outline = new paper.CompoundPath(outlinePaths);
      } else {
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

        paths.forEach((p) => addToDebugLayer(paper, "allPathsPreFilter", p));
        addToDebugLayer(
          paper,
          "originalBoundaryModel-inFilter",
          params.boundaryModel.clone()
        );

        function shouldUsePath(p: paper.PathItem) {
          const containmentBoundaryModel = params.boundaryModel;
          if (isInside(p, containmentBoundaryModel)) {
            return true;
          }

          if (params.percentageOutlineOverlapRequired === 0) {
            return false;
          }

          if (!p.intersects(containmentBoundaryModel)) {
            return false;
          }

          const intersection = p.intersect(containmentBoundaryModel);

          const intersectionPercentage =
            pathItemArea(intersection) / pathItemArea(p);

          return (
            intersectionPercentage >
            params.percentageOutlineOverlapRequired / 100
          );
        }

        paths = paths.filter((p) => shouldUsePath(p));

        paths.forEach((p) => addToDebugLayer(paper, "allPathsPostFilter", p));

        if (params.shrinkToFit) {
          // TOOD: wrong shrink
          const pathGroup = new paper.Group(paths);
          pathGroup.fitBounds(params.boundaryModel.bounds);
        }

        outline = await this.makeOutline({
          paper,
          params,
          paths,
          originalBoundaryModel,
          safeCone,
          symmetric: params.symmetric,
        });
      }
    }
    return { outline, paths };
  }

  public make = async (
    paper: paper.PaperScope,
    _params: {
      segments: number;
      boundaryModel: paper.PathItem;
      seed: string | number | undefined;
      safeCone: paper.PathItem;
      outerModel: paper.PathItem;
      breakThePlane: boolean;
      extendOutward: number;
      safeBorderWidth: number;
      ellipseExpand: boolean;
      minimumHoleSize: number;
    } & KaleidoscopeMakerParams
  ): Promise<InnerCompletedModel> => {
    // NOTE: we are copying this so we don't modify the global object
    // TOOD: break up how params works
    const params = { ..._params };

    this.initRNGs(params);

    // addToDebugLayer(paper,  "boundaryModel", params.boundaryModel.clone());

    addToDebugLayer(paper, "safeCone", params.safeCone.clone());

    const originalBoundaryModel = params.outerModel.clone();

    if (params.breakThePlane) {
      params.boundaryModel = bufferPath(
        paper,
        params.extendOutward,
        params.outerModel
      );

      if (params.ellipseExpand) {
        params.boundaryModel = new paper.Path.Ellipse(
          params.boundaryModel.bounds
        );
      }

      params.boundaryModel = params.boundaryModel.intersect(params.safeCone, {
        insert: false,
      });
    } else {
      params.boundaryModel = PaperOffset.offset(
        params.outerModel,
        -params.safeBorderWidth,
        {
          jointType: "jtMiter",
          endType: "etClosedPolygon",
          miterLimit: 2.0,
          roundPrecision: 0.25,
        }
      );
    }

    let kaleidoscopeMaker: KaleidoscopeMaker | null = null;
    const safeBoundaryModel = params.boundaryModel.clone();
    addToDebugLayer(paper, "safeBoundaryModel", safeBoundaryModel);

    if (this.canKaleido && params.segments > 1) {
      kaleidoscopeMaker = new KaleidoscopeMaker(paper, params);
      console.log("prior bounds", params.outerModel.bounds);
      params.boundaryModel = kaleidoscopeMaker.getBoundarySegment();
      addToDebugLayer(paper, "getBoundarySegment", params.outerModel.clone());
      params.boundaryModel = params.boundaryModel.intersect(params.safeCone, {
        insert: false,
      });
      console.log("new bounds", params.outerModel.bounds);

      addToDebugLayer(
        paper,
        "getBoundarySegmentClamped",
        params.outerModel.clone()
      );
    }

    addToDebugLayer(paper, "safeBoundaryModel", safeBoundaryModel);

    const design = await this.makeDesign(paper, params);

    // filter out possibly null paths for ease of designs
    let paths = design.paths
      .filter((p) => !!p)
      .filter((p) => p.bounds.area !== 0)
      .filter((p) => p.bounds.area > params.minimumHoleSize);

    // explode compound paths to make everything easier
    paths = paths.flatMap((path) => {
      if (path instanceof paper.CompoundPath) {
        return path.children as paper.PathItem[];
      } else {
        return [path];
      }
    });

    if (kaleidoscopeMaker) {
      params.boundaryModel = safeBoundaryModel;
      paths = kaleidoscopeMaker.reflectPaths(paths);
      console.log("done reflecting paths");
    }

    // maybe smooth paths
    paths = this.maybeSmooth(paper, params, paths);

    const shouldMakeOutline =
      safeBoundaryModel.bounds.height > params.outerModel.bounds.height;

    if ((this.needSubtraction || kaleidoscopeMaker) && !shouldMakeOutline) {
      console.log("clamping to boundary and cone");

      paths = clampPathsToBoundary(paths, params.safeCone);
      paths = clampPathsToBoundary(paths, safeBoundaryModel);
    } else {
      console.log("clamping to cone");
      paths = clampPathsToBoundary(paths, params.safeCone);
    }

    const outerModelToUse = params.originalOuterModel ?? originalBoundaryModel;
    const maybeOutline = await this.maybeMakeOutline(
      paper,
      params,
      paths,
      design,
      outerModelToUse,
      params.safeCone
    );
    paths = maybeOutline.paths;
    const outline = maybeOutline.outline;
    if (outline) {
      addToDebugLayer(paper, "finalOutline", outline);
    }

    // outline?.translate([
    //   outerModelToUse.bounds.center.x - outline.bounds.center.x,
    //   0,
    // ]);

    return new InnerCompletedModel({
      paths,
      outline,
    });
  };

  randomElement<T>(items: T[]): T {
    return items[Math.floor(this.rng() * items.length)];
  }
}
