export default function SelectDesignBlock({
  designClassName,
  onClick,
  designName,
  extraButtonClassNames,
}: {
  designClassName: string;
  onClick: () => void;
  designName: string;
  extraButtonClassNames?: string;
}) {
  const imgSrc = `demo-output/${designClassName}.png`;

  return (
    <div
      role="button"
      className="design-container col-sm-12 col-md-4"
      onClick={onClick}
    >
      <div className="panel panel-default border m-1 p-2">
        <div className="panel-body text-center d-flex align-items-center">
          <div className="align-center">
            <img src={imgSrc} alt={`${designClassName}`} />
          </div>
        </div>
        <div className="panel-footer text-center">
          <button
            className={`btn-primary btn-sm m-1 ${extraButtonClassNames}`}
            value={designClassName}
            onClick={onClick}
          >
            {designName}
          </button>
        </div>
      </div>
    </div>
  );
}
