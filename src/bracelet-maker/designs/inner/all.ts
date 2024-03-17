import { InnerDesignCirclePacking } from "./circle-packing";
import { InnerDesignCirclesXVera } from "./circles-x-vera";
import { InnerDesignEmpty } from "./empty";
import { InnerDesignGrid } from "./grid";
import { InnerDesignHashmarks } from "./hashmarks";
import { InnerDesignHexes } from "./hexes";
import { InnerDesignLattice } from "./lattice";
import { InnerDesignLines } from "./lines";
import { InnerDesignMap } from "./map";
import { InnerDesignMaze1 } from "./maze1";
import { InnerDesignMondrian } from "./mondrian";
import { InnerDesignPerlinBlobs } from "./perlin-blobs";
import { InnerDesignPerlinDots } from "./perlin-dots";
import { InnerDesignSnowflake } from "./snowflake";
import { InnerDesignSunflower } from "./sunflower";
import { InnerDesignTessagon } from "./tessagon";
import { InnerDesignVera } from "./vera";
import { InnerDesignVoronoi } from "./voronoi";

export const AllInnerDesigns = [
  InnerDesignMaze1,
  InnerDesignVoronoi,
  InnerDesignTessagon,
  InnerDesignHashmarks,
  InnerDesignVera,
  InnerDesignHexes,
  InnerDesignSnowflake,
  InnerDesignMap,
  InnerDesignSunflower,
  InnerDesignGrid,
  InnerDesignPerlinBlobs,
  InnerDesignLattice,
  InnerDesignCirclesXVera,
  InnerDesignCirclePacking,
  InnerDesignLines, // - KINDA BROKEN
  InnerDesignMondrian,
  InnerDesignPerlinDots,
  // InnerDesignTactile, - UNFINISHED
  // InnerDesignExplode, - BROKEN
  InnerDesignEmpty,
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
