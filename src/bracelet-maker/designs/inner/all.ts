import { InnerDesignCirclePacking } from "./circle-packing";
import { InnerDesignHashmarks } from "./hashmarks";
import { InnerDesignHexes } from "./hexes";
import { InnerDesignImageTrace } from "./image-trace";
import { InnerDesignMap } from "./map";
import { InnerDesignMaze1 } from "./maze1";
import { InnerDesignSacredGeometry } from "./sacred-geometry";
import { InnerDesignSnowflake } from "./snowflake";
import { InnerDesignSunflower } from "./sunflower";
import { InnerDesignTessagon } from "./tessagon";
import { InnerDesignText } from "./text";
import { InnerDesignVera } from "./vera";
import { InnerDesignVoronoi } from "./voronoi";

export const AllInnerDesigns = [
  InnerDesignImageTrace,
  InnerDesignVoronoi,
  InnerDesignMaze1,
  InnerDesignTessagon,
  InnerDesignHashmarks,
  InnerDesignVera,
  InnerDesignHexes,
  InnerDesignSnowflake,
  InnerDesignMap,
  InnerDesignSunflower,
  InnerDesignSacredGeometry,
  InnerDesignText,
  // InnerDesignGrid,
  // InnerDesignPerlinBlobs,
  // InnerDesignLattice,
  // InnerDesignCirclesXVera,
  InnerDesignCirclePacking,
  // InnerDesignLines, // - KINDA BROKEN
  // InnerDesignMondrian,
  // InnerDesignPerlinDots,
  // InnerDesignTactile, - UNFINISHED
  // InnerDesignExplode, - BROKEN
  // InnerDesignEmpty,
];

export const InnerDesignsToAnimate = [
  // InnerDesignMaze1,
  // InnerDesignVoronoi,
  // InnerDesignTessagon,
  // InnerDesignHashmarks,
  // InnerDesignVera,
  InnerDesignSnowflake,
  // InnerDesignTactile, - UNFINISHED
  // InnerDesignExplode, - BROKEN
];
