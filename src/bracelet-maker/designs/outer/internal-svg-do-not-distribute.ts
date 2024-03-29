import { MetaParameter } from "../../meta-parameter";
import { addToDebugLayer } from "../../utils/debug-layers";
import { flattenArrayOfPathItems } from "../../utils/paperjs-utils";
import { AbstractPathOuter } from "./abstract-path-outer";

export class InternalSvgOuter extends AbstractPathOuter {
  public get outerMetaParameters(): MetaParameter<any>[] {
    return [...super.abstractPathOuterMetaParameters({})];
  }

  async makeOuterModel(
    paper: paper.PaperScope,
    params: any
  ): Promise<{ path: paper.PathItem; holes: paper.PathItem[] }> {
    const { height, width } = params;

    const item = paper.project.importSVG(SVGs.braStrapForYuva, {
      expandShapes: true,
    });

    console.log({ item });
    addToDebugLayer(paper, "item", item);

    const paths = flattenArrayOfPathItems(paper, item);

    console.log({ paths });

    if (paths.length === 0 || !item) {
      return { path: new paper.Path(), holes: [] };
    }

    const biggestPath = paths.reduce((acc, path) => {
      return path.area < acc.area ? path : acc;
    });

    const otherPaths = paths.filter((path) => path !== biggestPath);
    addToDebugLayer(paper, "biggestPath", biggestPath);
    addToDebugLayer(paper, "otherPaths", otherPaths);

    return { path: biggestPath, holes: otherPaths };
  }
}

const SVGs = {
  braStrapForYuva: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <!-- Created with Inkscape (http://www.inkscape.org/) -->
  
  <svg
     version="1.1"
     id="svg88190"
     width="793.70068"
     height="1122.5197"
     viewBox="0 0 793.70069 1122.5197"
     sodipodi:docname="BraPatternallsizes.pdf"
     inkscape:version="1.2.2 (b0a84865, 2022-12-01)"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:svg="http://www.w3.org/2000/svg">
    <defs
       id="defs88194">
      <clipPath
         clipPathUnits="userSpaceOnUse"
         id="clipPath106320">
        <path
           d="M 0,0 H 595.2 V 841.68 H 0 Z"
           id="path106318" />
      </clipPath>
      <clipPath
         clipPathUnits="userSpaceOnUse"
         id="clipPath106374">
        <path
           d="M 0,0 H 595.2 V 841.68 H 0 Z"
           id="path106372" />
      </clipPath>
    </defs>
    <sodipodi:namedview
       id="namedview88192"
       pagecolor="#ffffff"
       bordercolor="#000000"
       borderopacity="0.25"
       inkscape:showpageshadow="2"
       inkscape:pageopacity="0.0"
       inkscape:pagecheckerboard="0"
       inkscape:deskcolor="#d1d1d1"
       showgrid="false"
       inkscape:zoom="0.58529044"
       inkscape:cx="7276.7291"
       inkscape:cy="544.17427"
       inkscape:window-width="1459"
       inkscape:window-height="877"
       inkscape:window-x="1080"
       inkscape:window-y="67"
       inkscape:window-maximized="0"
       inkscape:current-layer="g105752" />
    <g
       id="g105752"
       inkscape:groupmode="layer"
       inkscape:label="Page 9"
       transform="matrix(1.3333333,0,0,-1.3333333,-9.7509301e-6,1122.5197)">
      <g
         id="g106314">
        <g
           id="g106316"
           clip-path="url(#clipPath106320)">
          <g
             id="g106322"
             transform="scale(0.24)">
            <path
               d="M 2479,0 V 0"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106324" />
          </g>
          <path
             d="m 594.96,0 h 0.24 v 0.24 h -0.24 z"
             style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none"
             id="path106326" />
          <g
             id="g106328"
             transform="scale(0.24)">
            <path
               d="m 2479,3506 v 0"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106330" />
          </g>
          <path
             d="m 594.96,841.44 h 0.24 v 0.24 h -0.24 z"
             style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none"
             id="path106332" />
          <g
             id="g106334"
             transform="scale(0.24)">
            <path
               d="M 2479,0 V 3506"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106336" />
          </g>
          <g
             id="g106338"
             transform="scale(0.24)">
            <path
               d="M 2479,0 V 3506"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106340" />
          </g>
          <g
             id="g106342"
             transform="matrix(0.24,0,0,0.24,418.08,742.08)">
            <path
               d="M 17,0 C 17,9.388841 9.388841,17 0,17 -9.388841,17 -17,9.388841 -17,0 c 0,-9.388841 7.611159,-17 17,-17 9.388841,0 17,7.611159 17,17 z"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106344" />
          </g>
          <g
             id="g106346"
             transform="matrix(0.24,0,0,0.24,461.04,83.28)">
            <path
               d="M 17,0 C 17,9.388841 9.388841,17 0,17 -9.388841,17 -17,9.388841 -17,0 c 0,-9.388841 7.611159,-17 17,-17 9.388841,0 17,7.611159 17,17 z"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106348" />
          </g>
          <g
             id="g106350"
             transform="matrix(0.24,0,0,0.24,447.6,128.88)">
            <path
               d="M 17,0 C 17,9.388841 9.388841,17 0,17 -9.388841,17 -17,9.388841 -17,0 c 0,-9.388841 7.611159,-17 17,-17 9.388841,0 17,7.611159 17,17 z"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106352" />
          </g>
        </g>
      </g>
      <g
         id="g106368">
        <g
           id="g106370"
           clip-path="url(#clipPath106374)">
          <g
             id="g106376"
             transform="scale(0.24)">
            <path
               d="m 1714,3319 -22,-66 -18,-68 -14,-68 -9,-69 -6,-70 -2,-70 2,-69 7,-70 10,-69"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106378" />
          </g>
          <g
             id="g106380"
             transform="scale(0.24)">
            <path
               d="m 1714,3319 34,-10"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106382" />
          </g>
          <g
             id="g106384"
             transform="scale(0.24)">
            <path
               d="m 1762,3305 28,-9"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106386" />
          </g>
          <g
             id="g106388"
             transform="scale(0.24)">
            <path
               d="m 1805,3292 28,-8"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106390" />
          </g>
          <g
             id="g106392"
             transform="scale(0.24)">
            <path
               d="m 1847,3279 28,-8"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106394" />
          </g>
          <g
             id="g106396"
             transform="scale(0.24)">
            <path
               d="m 1889,3267 29,-9"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106398" />
          </g>
          <g
             id="g106400"
             transform="scale(0.24)">
            <path
               d="m 1932,3254 28,-8"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106402" />
          </g>
          <g
             id="g106404"
             transform="scale(0.24)">
            <path
               d="m 1974,3242 29,-9"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106406" />
          </g>
          <g
             id="g106408"
             transform="scale(0.24)">
            <path
               d="m 2017,3229 34,-10 -8,-59 -5,-58 v -59 l 4,-59 7,-58 12,-58 16,-57"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106410" />
          </g>
          <g
             id="g106412"
             transform="scale(0.24)">
            <path
               d="m 2107,1753 18,95 14,96 9,97 6,97 1,97 -3,97 -7,97 -10,97 -16,96 -19,95 -23,94"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106414" />
          </g>
          <g
             id="g106416"
             transform="scale(0.24)">
            <path
               d="m 2107,1753 -27,-99 -23,-99 -20,-100 -15,-101 -11,-101 -7,-102 -2,-102 1,-102 6,-101 10,-102 14,-101 18,-100 22,-100"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106418" />
          </g>
          <g
             id="g106420"
             transform="matrix(0.24,0,0,0.24,453.36,97.44)">
            <path
               d="m -174.9822,-65.9563 c 36.4267,-96.64 144.29851,-145.4525 240.9385,-109.0259 85.9421,32.3943 135.6375,122.40482 117.2634,212.3927"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106422" />
          </g>
          <g
             id="g106424"
             transform="scale(0.24)">
            <path
               d="m 1712,340 -8,34 -10,35 -12,33 -15,33 -18,31 -19,30 -22,28 -24,27 -26,25 -27,23 -29,21 -30,18"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:bevel;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106426" />
          </g>
          <g
             id="g106428"
             transform="matrix(0.24,0,0,0.238481,372,195.84)">
            <path
               d="m -156.5676,21.22677 c -8.6614,-63.8856 22.3609,-126.62587 78.38486,-158.52737"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106430" />
          </g>
          <g
             id="g106432"
             transform="scale(0.24)">
            <path
               d="m 1619,1659 -48,-134 -44,-135 -40,-137 -35,-137 -31,-139 -27,-140"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106434" />
          </g>
          <g
             id="g106436"
             transform="scale(0.24)">
            <path
               d="m 1619,1659 27,77 22,79 19,79 15,80 11,81 7,81 4,81 -1,81 -4,82 -9,81 -12,80 -16,80 -20,79"
               style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-dasharray:none;stroke-opacity:1"
               id="path106438" />
          </g>
        </g>
      </g>
    </g>
  </svg>
  `,
};
