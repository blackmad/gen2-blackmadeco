export function makeSVGData(
  paper: paper.PaperScope,
  toExport: paper.Project,
  shouldClean: boolean,
  elHydrator: (svgData: string) => any
) {
  const svgData: string = toExport.exportSVG({
    asString: true,
    matrix: new paper.Matrix(),
    bounds: "content",
  }) as unknown as string;

  const svg = elHydrator(svgData);

  if (shouldClean) {
    cleanSVGforDownload(svg);
  }
  reprocessSVG(paper, svg);
  return svg.outerHTML;
}

export function cleanSVGforDownload(svg: any) {
  function recurse(el: Element) {
    for (const x of Array.from(el.children)) {
      el.removeAttribute("transform");
      el.setAttribute("fill", "none");
      el.removeAttribute("fill-rule");
      if (el.tagName == "g") {
        el.setAttribute("stroke", "#ff0000");
        el.setAttribute("stroke-width", "0.001pt");
      }
      recurse(x);
    }
  }
  recurse(svg);
}

export function reprocessSVG(paper: any, svg: Element) {
  svg.setAttribute(
    "viewBox",
    `${paper.project.activeLayer.bounds.x} ${paper.project.activeLayer.bounds.y} ${paper.project.activeLayer.bounds.width + 0.05} ${paper.project.activeLayer.bounds.height + 0.05}`
  );
  svg.setAttribute("height", paper.project.activeLayer.bounds.height + "in");
  svg.setAttribute("width", paper.project.activeLayer.bounds.width + "in");
}
