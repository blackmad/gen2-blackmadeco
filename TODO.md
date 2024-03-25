- there's something slightly off everywhere about the patterns actually being symmetrical 
- it seems like it's happening on buffering ... ... maybe the answer when buffering is to make sure I'm recentering to the original center?

http://localhost:8080/#NecklaceOuter/InnerDesignMaze1?NecklaceOuter.neckSize=13.5&NecklaceOuter.outerHeightMultiplier=1.7&NecklaceOuter.outerWidth=8.5&NecklaceOuter.innerHeightMultiplier=1.3&NecklaceOuter.innerWidthRatio=0.85&InnerDesignMaze1.safeBorderWidth=0.25&InnerDesignMaze1.seed=250&InnerDesignMaze1.rows=6&InnerDesignMaze1.cols=6&InnerDesignMaze1.rowRepeat=5&InnerDesignMaze1.colRepeat=4&InnerDesignMaze1.borderSize=0.06&InnerDesignMaze1.maxChainSize=1&InnerDesignMaze1.idealMinChainSize=4&InnerDesignMaze1.minChainSize=0&InnerDesignMaze1.mirrorRows=true&InnerDesignMaze1.mirrorCols=true&InnerDesignMaze1.rowTileBoundary=true&InnerDesignMaze1.colTileBoundary=true&InnerDesignMaze1.omitTileChance=0&InnerDesignMaze1.shouldSmooth=true&InnerDesignMaze1.smoothingFactor=0.85&InnerDesignMaze1.breakThePlane=true&InnerDesignMaze1.extendOutward=0.25&InnerDesignMaze1.concavity=0.4&InnerDesignMaze1.lengthThreshold=0.5&InnerDesignMaze1.outlineSize=0.2&InnerDesignMaze1.safeCone=Path%20%40290023&InnerDesignMaze1.outerModel=Path%20%40290025&InnerDesignMaze1.originalOuterModel=Path%20%40290026
(see middle line vs pattern)

- finish necklace
- get break the plane working more reliably
- earring mode
- engrave mode
- revisit map layers / drawing

MAP
- keep trying to do something cool for AMS

TRACE
- option to delete points with too acute angle - this code did not work at all

OVERALL
- add something to save defaults for sizes
- add male/female buttons

- add a way to flip holes to engraves

- fix break-the-plane on voronoi

TEXT:
- why is centering so bad?

- fix map design
--> figure out what it needs for yuva's map
--> get it to default to unrounded? or much less rounded?
--> why kaleido unhappy middle in map someimte

TRACE
- fix the offset of the repeat for centering
- document some of these
- remove unneeded inner holes

- fix back/forward navigation in the app

- make a more geometric-intersecting shape design like https://www.pinterest.com/pin/658440408009961386/


- redo mondrian grid to be on an actual grid

- zero eslint errors
- zero eslint warnings

- implement cuffs
- implement multi-row/multi-column
- dive deeper into tiling designs

- spelunk and document and uncouple how params are passed around

- do crazy typesafe stuff

- so an overall problem with the code coup ling is how boundaryModel sometimes means the area to draw in and sometimes means the outer bounds

- would so love to have some designs that do more curving
- would so love to have some designs that do more organic stuff
- would so love to have some designs that do more brocade stuff


- god would really love to try adding size below the svg again