import * as SimplexNoise from "simplex-noise";

export class SimplexNoiseUtils {
 // @ts-ignore
 static positiveNoise2D(simplexGenerator: SimplexNoise, xin: number, yin: number) {
    return (simplexGenerator.noise2D(xin, yin) + 1.0) /2.0
  }

 // @ts-ignore
  static noise2DInRange(simplexGenerator: SimplexNoise, xin: number, yin: number, min: number, max: number) {
    return SimplexNoiseUtils.positiveNoise2D(simplexGenerator, xin, yin) * (max - min) + min;
  }
}
