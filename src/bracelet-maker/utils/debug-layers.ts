import randomColor from "randomcolor";

const debugLayers: Record<string, paper.Group> = {};

export function addToDebugLayer(
  paper: paper.PaperScope,
  layerName: string,
  item: paper.Item | paper.Point | paper.Rectangle
) {
  if (!debugLayers[layerName]) {
    const newLayer = new paper.Group();
    debugLayers[layerName] = newLayer;
    newLayer.visible = false;

    const color = new paper.Color(randomColor());
    const fillColor = color.clone();
    fillColor.alpha = 0.5;

    newLayer.style = {
      ...newLayer.style,
      strokeColor: color,
      strokeWidth: 0.04,
      fillColor: fillColor,
    };
  }

  let path: paper.Item | null = null;
  if (item instanceof paper.Point) {
    path = new paper.Path.Circle(item, 0.05);
  } else if (item instanceof paper.Rectangle) {
    path = new paper.Path.Rectangle(item);
  } else {
    if (
      item instanceof paper.Path.Line ||
      (item instanceof paper.Path && !item.closed)
    ) {
      debugLayers[layerName].style.strokeWidth = 0.02;
      debugLayers[layerName].style.fillColor = null;
    }

    path = item;
  }
  debugLayers[layerName].addChild(path);
  path.style = debugLayers[layerName].style;
}

export function getDebugLayers() {
  return debugLayers;
}

export function getDebugLayerNames() {
  return Object.keys(debugLayers);
}
