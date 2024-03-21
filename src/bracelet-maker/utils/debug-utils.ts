import _ from "lodash";

function isBrowser() {
  return typeof window !== "undefined";
}

export function addDebugInfo(s: string) {
  if (_.isString(s)) {
    if (isBrowser()) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(s, "text/html");
      document.body.appendChild(doc.body);
    }
  }
}
