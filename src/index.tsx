import "./styles.css";
import "bootstrap/dist/css/bootstrap.css";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./components/App/App";
import SelectInnerDesignPage from "./components/SelectInnerDesignPage";
import SelectOuterDesignPage from "./components/SelectOuterDesignPage";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

function HardcodedRouter() {
  const [outerDesign, setOuterDesign] = useState("");
  const [innerDesign, setInnerDesign] = useState("");
  const [hasInitted, setHasInnited] = useState(false);

  useEffect(() => {
    window.addEventListener("popstate", (e) => {
      reparseUrl();
    });
  });

  const reparseUrl = () => {
    const parts = window.location.pathname.split("/").filter((p) => p);

    console.log({ parts });

    setOuterDesign(parts[0]);
    setInnerDesign(parts[1]);
  };

  useEffect(() => {
    reparseUrl();
    setHasInnited(true);
  }, []);

  useEffect(() => {
    if (!hasInitted) {
      return;
    }
    const newPath = [outerDesign, innerDesign].join("/");

    if ("/" + newPath === window.location.pathname) {
      return;
    }

    console.log("pushing state  ", newPath, "frdom ", window.location.pathname);
    window.history.pushState(
      {},
      "",
      [outerDesign, innerDesign]
        .join("/")
        .replace(window.location.pathname.substring(1), "")
    );
  }, [innerDesign, outerDesign, hasInitted]);

  if (!outerDesign) {
    return <SelectOuterDesignPage onClick={setOuterDesign} />;
  } else if (!innerDesign) {
    return <SelectInnerDesignPage onClick={setInnerDesign} />;
  } else {
    return <App innerDesign={innerDesign} outerDesign={outerDesign} />;
  }
  return <></>;
}

root.render(
  <React.StrictMode>
    <HardcodedRouter />
  </React.StrictMode>
);
