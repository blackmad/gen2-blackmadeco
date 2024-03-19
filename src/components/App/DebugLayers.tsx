import { getDebugLayers } from "../../bracelet-maker/utils/debug-layers";

export default function DebugLayers({ onChange }: { onChange: () => void }) {
  const debugLayers = getDebugLayers();
  const debugLayerNames = Object.keys(debugLayers);
  if (!debugLayerNames.length) {
    return;
  }

  function cssColor(name: string) {
    const value = debugLayers[name];
    return value.style.strokeColor?.toCSS(true) ?? "#000000";
  }

  function toggleVisibility(name: string) {
    const value = debugLayers[name];
    value.visible = !value.visible;

    onChange();
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
