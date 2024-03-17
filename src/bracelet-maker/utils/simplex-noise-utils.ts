import { NoiseFunction2D } from "simplex-noise";

export class SimplexNoiseUtils {
  static positiveNoise2D(
    simplexGenerator: NoiseFunction2D,
    xin: number,
    yin: number
  ) {
    return (simplexGenerator(xin, yin) + 1.0) / 2.0;
  }

  static noise2DInRange(
    simplexGenerator: NoiseFunction2D,
    xin: number,
    yin: number,
    min: number,
    max: number
  ) {
    return (
      SimplexNoiseUtils.positiveNoise2D(simplexGenerator, xin, yin) *
        (max - min) +
      min
    );
  }
}
