import { InnerDesignCirclePacking } from "./circle-packing";
import { InnerDesignCirclesXVera } from "./circles-x-vera";
import { InnerDesignHashmarks } from "./hashmarks";
import { InnerDesignHexes } from "./hexes";
import { InnerDesignImageTrace } from "./image-trace";
import { InnerDesignLattice } from "./lattice";
import { InnerDesignMap } from "./map";
import { InnerDesignMaze1 } from "./maze1";
import { InnerDesignPerlinBlobs } from "./perlin-blobs";
import { InnerDesignSnowflake } from "./snowflake";
import { InnerDesignSunflower } from "./sunflower";
import { InnerDesignTessagon } from "./tessagon";
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
  // InnerDesignGrid,
  InnerDesignPerlinBlobs,
  InnerDesignLattice,
  InnerDesignCirclesXVera,
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
