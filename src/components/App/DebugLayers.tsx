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
      <div className="d-flex flex-row flex-wrap">
        {debugLayerNames.map((name) => {
          return (
            <label
              key={name}
              style={{ color: cssColor(name) }}
              className="pr-4"
            >
              <input
                type="checkbox"
                key={name}
                onClick={() => toggleVisibility(name)}
                className="mr-1"
              />
              {name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
