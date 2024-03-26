import _ from "lodash";

import { makeUriQueryString } from "../meta-parameter";

export function makeSVGData({
  paper,
  toExport,
  shouldClean,
  elHydrator,
  modelParams,
}: {
  paper: paper.PaperScope;
  toExport: Pick<paper.Project, "exportSVG">;
  shouldClean: boolean;
  elHydrator: (svgData: string) => any;
  modelParams: Record<string, Record<string, any>>;
}) {
  const svgData: string = toExport.exportSVG({
    asString: true,
    matrix: new paper.Matrix(),
    bounds: "content",
  }) as unknown as string;

  const svg = elHydrator(svgData);

  if (shouldClean) {
    cleanSVGforDownload(svg);
  }

  // make a big comment
  const commentBlock = _.map(modelParams, (subDict, modelName) => {
    return _.map(subDict, (paramValue: any, paramName: string) => {
      return `  ${modelName}.${paramName}: ${paramValue}`;
    }).join("\n");
  }).join("\n\n");

  const comment = `<!--

Built on ${new Date().toISOString()}

${commentBlock}

## Param string
${makeUriQueryString(modelParams)}

-->`;

  reprocessSVG(paper, svg);
  return comment + "\n\n" + svg.outerHTML;
}

export function cleanSVGforDownload(svg: any) {
  function recurse(el: Element) {
    for (const x of Array.from(el.children)) {
      x.removeAttribute("transform");
      x.setAttribute("fill", "none");
      x.removeAttribute("fill-rule");
      if (x.tagName == "g") {
        x.setAttribute("stroke", "#ff0000");
        x.setAttribute("stroke-width", "0.001pt");
      }
      recurse(x);
    }
  }
  recurse(svg);
}

export function reprocessSVG(paper: paper.PaperScope, svg: Element) {
  svg.setAttribute(
    "viewBox",
    `${paper.project.activeLayer.bounds.x} ${paper.project.activeLayer.bounds.y} ${paper.project.activeLayer.bounds.width + 0.05} ${paper.project.activeLayer.bounds.height + 0.05}`
  );
  svg.setAttribute("height", paper.project.activeLayer.bounds.height + "in");
  svg.setAttribute("width", paper.project.activeLayer.bounds.width + "in");
}

export const svgStringHydrator = (svgData: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgData, "image/svg+xml");
  return doc.firstChild;
};
