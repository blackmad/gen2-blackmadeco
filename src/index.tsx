import "./styles.css";
import "bootstrap/dist/css/bootstrap.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
