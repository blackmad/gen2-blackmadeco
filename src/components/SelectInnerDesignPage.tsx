import { AllInnerDesigns } from "../bracelet-maker/designs/inner/all";
import AbstractSelectDesignPage from "./AbstractSelectDesignPage";

export default function SelectInnerDesignPage({
  onClick,
}: {
  onClick: (design: string) => void;
}) {
  return (
    <AbstractSelectDesignPage
      designs={AllInnerDesigns}
      shapeName="inner"
      onClick={onClick}
    />
  );
}
