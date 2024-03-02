import React from "react";
import ReactDOM from "react-dom/client";

import { Graph } from "./components/graph";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.backgroundColor = "#F6F6F6";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Graph count={5} />);
