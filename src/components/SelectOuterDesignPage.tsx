import { AllOuterDesigns } from "../bracelet-maker/designs/outer/all";
import AbstractSelectDesignPage from "./AbstractSelectDesignPage";

export default function SelectOuterDesignPage({
  onClick,
}: {
  onClick: (design: string) => void;
}) {
  return (
    <AbstractSelectDesignPage
      designs={AllOuterDesigns}
      shapeName="outer"
      onClick={onClick}
    />
  );
}
