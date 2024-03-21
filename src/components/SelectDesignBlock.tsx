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
  const imgSrc = `/demo-output/${designClassName}.png`;

  return (
    <div
      role="button"
      className="design-container col-sm-12 col-md-4 p-1"
      onClick={onClick}
    >
      <div className="d-flex flex-column h-100 panel panel-default border m-1 p-2">
        <div className="panel-body text-center d-flex align-items-center justify-content-center flex-grow-1">
          <img
            className="select-design-block-img"
            src={imgSrc}
            alt={`${designClassName}`}
          />
        </div>
        <div className="panel-footer text-center">
          <button
            className={`btn btn-primary btn-sm mt-3 mb-1 ${extraButtonClassNames}`}
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
