import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

import React from "react";

import HomePage from "./components/Home/HomePage";

const App: React.FC = () => {
  return (
    <div id="App">
      <HomePage />
    </div>
  );
};

export default App;
