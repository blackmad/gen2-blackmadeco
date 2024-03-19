import { useNavigate } from "react-router-dom";

import { AllOuterDesigns } from "../bracelet-maker/designs/outer/all";
import AbstractSelectDesignPage from "./AbstractSelectDesignPage";

export default function SelectOuterDesignPage() {
  const navigate = useNavigate();

  return (
    <AbstractSelectDesignPage
      designs={AllOuterDesigns}
      shapeName="outer"
      onClick={(name: string) => {
        console.log(`Redirecting to /${name}`);
        return navigate(`/${name}`);
      }}
    />
  );
}
