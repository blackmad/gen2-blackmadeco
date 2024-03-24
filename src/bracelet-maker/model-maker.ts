import { MetaParameter } from "./meta-parameter";

export interface HasMetaParameters {
  readonly metaParameters: MetaParameter<any>[];
}

export class InnerCompletedModel {
  paths: paper.PathItem[];
  outline: paper.PathItem | null;

  constructor({
    paths,
    outline,
  }: {
    paths: paper.PathItem[];
    outline: paper.PathItem | null;
  }) {
    this.paths = paths;
    this.outline = outline;
  }
}

export interface PaperModelMaker extends HasMetaParameters {
  make(scope: paper.PaperScope, params: any): Promise<InnerCompletedModel>;

  controlInfo: string;
}

export class CompletedModel {
  outer: paper.PathItem;
  holes: paper.PathItem[];
  design: paper.PathItem[];

  constructor({
    outer,
    holes,
    design,
  }: {
    outer: paper.PathItem;
    holes: paper.PathItem[];
    design: paper.PathItem[];
  }) {
    this.outer = outer;
    this.holes = holes;
    this.design = design;
  }
}

export abstract class OuterPaperModelMaker implements HasMetaParameters {
  subModel: PaperModelMaker;
  controlInfo: string;

  abstract make(scope: paper.PaperScope, params: any): Promise<CompletedModel>;
  abstract get outerMetaParameters(): MetaParameter<any>[];

  get metaParameters() {
    return [
      // new OnOffMetaParameter({
      //   title: "Debug",
      //   name: "debug",
      //   value: true,
      // }),
      ...this.outerMetaParameters,
    ];
  }
}
