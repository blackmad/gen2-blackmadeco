import {
  getDebugLayerNames,
  getDebugLayers,
} from "../../bracelet-maker/utils/debug-layers";

export default function DebugLayers({}) {
  const debugLayers = getDebugLayers();
  const debugLayerNames = getDebugLayerNames();
  if (!debugLayers.length) {
    return;
  }

  function cssColor(name: string) {
    const value = debugLayers[name];
    return value.style.strokeColor.toCSS();
  }

  function toggleVisibility(name: string) {
    const value = debugLayers[name];
    value.visible = !value.visible;

    console.log("toggling debug layer ", name, "on");
    // this.rerender();
  }

  return (
    <div id="parameterSection" className="m-3">
      <h1 className="title">Debug Layers</h1>
      {debugLayerNames.map((name) => {
        return (
          <label key={name} style={{ color: cssColor(name) }}>
            <input
              type="checkbox"
              key={name}
              onClick={() => toggleVisibility(name)}
            />
            {name}
          </label>
        );
      })}
    </div>
  );
}
