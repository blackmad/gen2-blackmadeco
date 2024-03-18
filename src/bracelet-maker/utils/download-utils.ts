import { OuterPaperModelMaker } from "../model-maker";

export function makeFilename({
  extension,
  modelMaker,
  params,
}: {
  extension: string;
  modelMaker: OuterPaperModelMaker;
  params: Record<string, any>;
}): string {
  let filename = modelMaker.constructor.name;
  if (modelMaker.subModel) {
    filename =
      modelMaker.constructor.name + "-" + modelMaker.subModel.constructor.name;
  }
  const modelName = modelMaker.constructor.name;
  filename += `-${params[modelName + ".height"]}x${
    params[modelName + ".wristCircumference"]
  }x${params[modelName + ".forearmCircumference"]}`;
  filename += "." + extension;
  return filename;
}

export function sendFileToUser({
  dataUri,
  filename,
}: {
  dataUri: string;
  filename: string;
}) {
  const downloadLink = document.createElement("a");
  downloadLink.href = dataUri;

  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  return false;
}
