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

  console.log(dataUri);

  const º = "%c";
  const consoleNormal = "font-family: sans-serif";
  const consoleBold = "font-family: sans-serif;" + "font-weight: bold";
  const consoleCode =
    "background: #EEEEF6;" +
    "border: 1px solid #B2B0C1;" +
    "border-radius: 7px;" +
    "padding: 2px 8px 3px;" +
    "color: #5F5F5F;" +
    "line-height: 22px;" +
    "box-shadow: 0px 0px 1px 1px rgba(178,176,193,0.3)";
  const consoleBackground = `
  background-image: url('${dataUri}');
  width: 100px;
  height: 100px;
  padding: 100px;
  line-height: 100px;
  `;

  console.info(º + " ", consoleBackground);
}
