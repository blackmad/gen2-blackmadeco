KALEIDO / snowflow
- clamp voronoi to http://localhost:8080/#StraightCuffOuter/InnerDesignSnowflake?StraightCuffOuter.height=1.5&StraightCuffOuter.wristCircumference=7.2&StraightCuffOuter.wideWristCircumferencePerInchMultiplier=0.25&InnerDesignSnowflake.safeBorderWidth=0.25&InnerDesignSnowflake.seed=16&InnerDesignSnowflake.numPoints=20&InnerDesignSnowflake.numBorderPoints=0&InnerDesignSnowflake.borderSize=0.1&InnerDesignSnowflake.rows=1&InnerDesignSnowflake.cols=1&InnerDesignSnowflake.mirror=true&InnerDesignSnowflake.voronoi=true&InnerDesignSnowflake.removeEdgePolygons=false&InnerDesignSnowflake.kaleido=true&InnerDesignSnowflake.segmentBuffer=0&InnerDesignSnowflake.segments=12&InnerDesignSnowflake.shouldSmooth=true&InnerDesignSnowflake.smoothingFactor=0.4&InnerDesignSnowflake.breakThePlane=true&InnerDesignSnowflake.extendOutward=0.22&InnerDesignSnowflake.concavity=2&InnerDesignSnowflake.lengthThreshold=0.25&InnerDesignSnowflake.outlineSize=0.2&InnerDesignSnowflake.safeCone=Path%20%40144062&InnerDesignSnowflake.outerModel=Path%20%40144052

OUTLINE
- turn off symmetry when not needed


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


APP
- fix back/forward navigation in the app

VORONOI
- open debug layer - notice how the blobs are not perfectly symmetric here for some reason? http://localhost:8080/#NecklaceOuter/InnerDesignVoronoi?NecklaceOuter.neckSize=15.5&NecklaceOuter.outerHeightMultiplier=1.7&NecklaceOuter.outerWidth=8.5&NecklaceOuter.innerHeightMultiplier=1.3&NecklaceOuter.innerWidthRatio=0.85&InnerDesignVoronoi.safeBorderWidth=0.25&InnerDesignVoronoi.seed=2007&InnerDesignVoronoi.numPoints=40&InnerDesignVoronoi.numBorderPoints=0&InnerDesignVoronoi.borderSize=0.1&InnerDesignVoronoi.rows=1&InnerDesignVoronoi.cols=2&InnerDesignVoronoi.mirror=true&InnerDesignVoronoi.voronoi=true&InnerDesignVoronoi.removeEdgePolygons=false&InnerDesignVoronoi.shouldSmooth=true&InnerDesignVoronoi.smoothingFactor=0.8&InnerDesignVoronoi.breakThePlane=true&InnerDesignVoronoi.extendOutward=0.26&InnerDesignVoronoi.concavity=1.8&InnerDesignVoronoi.lengthThreshold=0.5&InnerDesignVoronoi.outlineSize=0.26&InnerDesignVoronoi.safeCone=Path%20%4059510&InnerDesignVoronoi.outerModel=Path%20%4059512&InnerDesignVoronoi.originalOuterModel=Path%20%4059513

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