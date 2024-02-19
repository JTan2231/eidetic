import React from "react";
import ReactDOM from "react-dom/client";

import { Graph, Hotbar } from "./components/graph";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <Hotbar />
        <Graph count={5} />
    </React.StrictMode>,
);
