import SelectDesignBlock from "./SelectDesignBlock";

export default function AbstractSelectDesignPage({
  shapeName,
  designs,
  onClick,
}: {
  shapeName: string;
  designs: Array<{ name: string }>;
  onClick: (name: string) => void;
}) {
  return (
    <div>
      <div className="container p-xs-3 p-sm-3 p-md-4 p-lg-5">
        <div className="row">
          <h2>Pick an {shapeName} shape</h2>
        </div>
        <div className="row  justify-content-center">
          {designs.map((design) => {
            return (
              <SelectDesignBlock
                designName={design.name
                  .replace("Outer", "")
                  .replace("Inner", "")}
                designClassName={design.name}
                key={design.name}
                onClick={() => {
                  onClick(design.name);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
