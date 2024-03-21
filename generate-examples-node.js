import fs from "fs";
import { JSDOM } from "jsdom";
import paper from "paper-jsdom";

import { demoDesign } from "./src/bracelet-maker/demo/demo";
import { AllInnerDesigns } from "./src/bracelet-maker/designs/inner/all";
// import { svg2png } from 'svg-png-converter';
import { InnerDesignEmpty } from "./src/bracelet-maker/designs/inner/empty";
import { AllOuterDesigns } from "./src/bracelet-maker/designs/outer/all";
const child_process = require("child_process");

var SegfaultHandler = require("segfault-handler");

SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

paper.setup();
paper.settings.insertItems = false;

const outputDir = "public/demo-output/";

function elHydrator(svg) {
  const el = new JSDOM("<div>" + svg + "</div>");
  return el.window.document.getElementsByTagName("svg")[0];
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const readmeFd = fs.openSync("README.md", "w");

async function generateDesigns(header, designs) {
  fs.writeSync(readmeFd, `# ${header}\n`);
  await asyncForEach(designs, async (innerDesign) => {
    console.log(innerDesign.name);
    paper.project.activeLayer.removeChildren();
    const { svg, params } = await demoDesign(
      paper,
      new innerDesign(new InnerDesignEmpty()),
      elHydrator
    );
    console.log("svg?", { svg });
    const svgPath = outputDir + innerDesign.name + ".svg";
    fs.writeFileSync(svgPath, svg);

    const outputPath = outputDir + innerDesign.name + ".png";
    child_process.execSync(`svg2png -w 300 ${svgPath} ${outputPath}`);
    fs.writeSync(readmeFd, `## ${innerDesign.name}\n`);
    fs.writeSync(readmeFd, `![${outputPath}](${outputPath})\n`);
  });
}

async function generateAll() {
  await generateDesigns("Outer Designs", AllOuterDesigns);
  await generateDesigns("Inner Designs", AllInnerDesigns);
}

// check if svg2png cli tool is installed by checking path and stuff

generateAll();
