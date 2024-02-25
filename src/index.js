import React from "react";
import ReactDOM from "react-dom/client";

import { Graph } from "./components/graph";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <Graph count={5} />
    </React.StrictMode>,
);
