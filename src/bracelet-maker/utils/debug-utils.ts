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

export function displayDataUriImageToConsole(dataUri: string) {
  // console.log(dataUri);
  // const height = 100;
  // console.log(
  //   "%c",
  //   [
  //     "font-size: 1px;",
  //     `line-height: ${height}px;`,
  //     // `padding: ${height * 0.5}px ${width * 0.5}px;`,
  //     // `background-size: ${this.width}px ${this.height}px;`,
  //     `background: url(${dataUri});`,
  //   ].join(" ")
  // );

  const º = "%c";
  const consoleBackground = `
  background-image: url('${dataUri}');
  padding: 400px;
  background-size: contain;
  `;

  console.info(º + " ", consoleBackground);
}
