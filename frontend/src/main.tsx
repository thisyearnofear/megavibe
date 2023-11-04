import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

const container = document.getElementById("root");
if (container) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    container
  );
}
