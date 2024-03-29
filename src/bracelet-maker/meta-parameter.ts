import turfBBox from "@turf/bbox";
import turfBooleanPointInPolygon from "@turf/boolean-point-in-polygon";
import * as _ from "lodash";

import nyc from "./geojson/simplified/nyc.json";
import { isNonNullable } from "./utils/type-utils";

export enum MetaParameterType {
  Range,
  Select,
  OnOff,
  Geocode,
  String,
}

export interface MetaParameterBaseParams<T> {
  name: string;
  title: string;
  value: T;
  target?: string | null;
  group?: string | null;
  help?: string | null;
  shouldDisplay?: (params: any) => boolean;
  parentParam?: OnOffMetaParameter;
}

export abstract class MetaParameter<T> {
  public name: string;
  public title: string;
  public target: string | null = null;
  public group: string | null;
  public help: string | null;
  public value: T;
  public type: MetaParameterType | null = null;
  public shouldDisplay?: () => boolean;
  public parentParam?: OnOffMetaParameter;

  valueFromString(value: string) {
    if (typeof this.value == "number") {
      return Number(value);
    } else if (typeof this.value == "boolean") {
      return value == "true";
    } else {
      return value;
    }
  }

  public abstract getRandomValue(): T;

  constructor(params: MetaParameterBaseParams<T>) {
    this.name = params.name;
    this.title = params.title;
    this.target = params.target ?? null;
    this.group = params.group ?? null;
    this.help = params.help ?? null;
    this.value = params.value;
    this.shouldDisplay = params.shouldDisplay;
    this.parentParam = params.parentParam;
  }
}

export interface RangeMetaParameterParams
  extends MetaParameterBaseParams<number> {
  min: number;
  max: number;
  step: number;
  randMin?: number;
  randMax?: number;
}

export class RangeMetaParameter extends MetaParameter<number> {
  public min: number;
  public max: number;
  public randMin: number;
  public randMax: number;
  public step: number;
  public type = MetaParameterType.Range;

  constructor(params: RangeMetaParameterParams) {
    super(params);
    this.min = params.min;
    this.max = params.max;
    this.randMin = params.randMin ?? 0;
    this.randMax = params.randMax ?? 0;
    this.step = params.step;
  }

  getRandomValue() {
    if (!this.randMin || !this.randMax) {
      return this.value;
    }

    const steps = (this.randMax - this.randMin) / this.step;
    const randStep = _.random(0, steps);
    const value = this.randMin + randStep * this.step;

    return value;
  }
}

export interface SelectMetaParameterParams
  extends MetaParameterBaseParams<string> {
  options: string[];
}

export class SelectMetaParameter extends MetaParameter<string> {
  public options: string[];
  public type = MetaParameterType.Select;

  constructor(params: SelectMetaParameterParams) {
    super(params);
    this.options = params.options;
  }

  getRandomValue() {
    return _.sample(this.options);
  }
}

export interface StringMetaParameterParams
  extends MetaParameterBaseParams<string> {
  defaults: string[];
}

export class StringMetaParameter extends MetaParameter<string> {
  public defaults: string[];
  public type = MetaParameterType.String;

  constructor(params: StringMetaParameterParams) {
    super(params);
    this.defaults = params.defaults;
  }

  getRandomValue() {
    return _.sample(this.defaults);
  }
}

export interface OnOffMetaParameterParams
  extends MetaParameterBaseParams<boolean> {}

export class OnOffMetaParameter extends MetaParameter<boolean> {
  public type = MetaParameterType.OnOff;

  constructor(params: OnOffMetaParameterParams) {
    super(params);
  }

  getRandomValue() {
    return Math.random() > 0.5;
  }
}

export interface GeocodeMetaParameterParams
  extends MetaParameterBaseParams<string> {
  text: string;
}
export class GeocodeMetaParameter extends MetaParameter<string> {
  public text: string;
  public value: string;
  public type = MetaParameterType.Geocode;

  constructor(params: GeocodeMetaParameterParams) {
    super(params);
    this.value = params.value;
    this.text = params.text;
  }

  getRandomValue() {
    const [minX, minY, maxX, maxY] = turfBBox(nyc.features[0] as any);

    let tries = 0;

    while (tries < 1000) {
      const x = _.random(minX, maxX);
      const y = _.random(minY, maxY);
      if (turfBooleanPointInPolygon([x, y], nyc.features[0] as any)) {
        return `${y},${x}`;
      }
      tries += 1;
    }

    return "ERROR";
  }
}

export function makeUriQueryString(modelParams: any) {
  return _.flatMap(
    modelParams,
    (paramDict: Record<string, any>, modelName: string) => {
      return _.map(paramDict, (paramValue: any, paramName: string) => {
        return (
          encodeURIComponent(`${modelName}.${paramName}`) +
          "=" +
          encodeURIComponent(`${paramValue}`)
        );
      });
    }
  )
    .filter(isNonNullable)
    .join("&");
}
