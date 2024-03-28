import "./styles.css";

// import "bootstrap/dist/css/bootstrap.css";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ModalProvider } from "react-modal-hook";

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
    window.addEventListener("popstate", reparseUrl);
    window.addEventListener("hashchange", reparseUrl);

    return () => {
      window.removeEventListener("popstate", reparseUrl);
      window.removeEventListener("hashchange", reparseUrl);
    };
  });

  const reparseUrl = () => {
    const parts = window.location.hash
      .substring(1)
      .split("?")[0]
      .split("/")
      .filter((p) => p);

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
    const search = window.location.hash.split("?")[1];

    window.history.pushState(
      {},
      "",
      "#" + newPath + (search ? "?" + search : "")
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
    <ModalProvider>
      <HardcodedRouter />
    </ModalProvider>
  </React.StrictMode>
);
