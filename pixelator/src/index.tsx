import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.scss";
import Pixelator from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Pixelator />
  </React.StrictMode>
);

reportWebVitals();
