import { useLoaderData, useNavigate } from "react-router-dom";

import { AllInnerDesigns } from "../bracelet-maker/designs/inner/all";
import AbstractSelectDesignPage from "./AbstractSelectDesignPage";

export default function SelectInnerDesignPage() {
  const navigate = useNavigate();
  const { outerDesign } = useLoaderData() as any;
  return (
    <AbstractSelectDesignPage
      designs={AllInnerDesigns}
      shapeName="inner"
      onClick={(name: string) => {
        return navigate(`/${outerDesign}/${name}`);
      }}
    />
  );
}
