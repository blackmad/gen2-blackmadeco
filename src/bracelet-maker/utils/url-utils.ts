export function parseHash() {
  window.location.hash
    .substring(1)
    .split("&")
    .filter((param) => param.length > 0)
    .forEach((param) => {
      const [key, value] = param.split("=");
      const [model, name] = decodeURIComponent(key).split(".");
      params[model][name] = getParsedValue(
        model,
        name,
        decodeURIComponent(value)
      );
    });
}
