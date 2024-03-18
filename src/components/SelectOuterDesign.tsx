import { AllOuterDesigns } from "../bracelet-maker/designs/outer/all";
import SelectDesignBlock from "./SelectDesignBlock";

export default function SelectOuterDesign() {
  const designs = AllOuterDesigns;

  return (
    <div>
      <div className="container p-xs-3 p-sm-3 p-md-4 p-lg-5">
        <div className="row">
          <h2>Pick an outer shape</h2>
        </div>
        <div className="row">
          {designs.map((design) => {
            return (
              <SelectDesignBlock
                designName={design.name.replace("Outer", "")}
                designClassName={design.name}
                key={design.name}
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
