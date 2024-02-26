import React from "react";
import ReactDOM from "react-dom/client";

import { Graph } from "./components/graph";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Graph count={5} />);
