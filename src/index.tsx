import "./styles.css";
import "bootstrap/dist/css/bootstrap.css";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";

import App from "./components/App/App";
import SelectInnerDesignPage from "./components/SelectInnerDesignPage";
import SelectOuterDesignPage from "./components/SelectOuterDesignPage";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/design",
    element: <App />,
  },
  {
    path: "/:outerDesign",
    element: <SelectInnerDesignPage />,
    loader: ({ params }) => {
      return { outerDesign: params.outerDesign };
    },
  },
  {
    path: "/",
    element: <SelectOuterDesignPage />,
  },
  {
    path: "/:outerDesign/:innerDesign/",
    element: <App />,
    loader: ({ params }) => {
      return {
        outerDesign: params.outerDesign,
        innerDesign: params.innerDesign,
      };
    },
  },
]);

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
    console.log("pushing state", [outerDesign, innerDesign].join("/"));
    window.history.pushState(
      {},
      "",
      [outerDesign, innerDesign].join("/").replace(window.location.pathname, "")
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
