import { useState, useEffect } from "react";
import "../styles/graph.css";

const NODE_DIAMETER = 50;
const UNFOCUSED_OPACITY = 0.15;

function getRandom(max) {
    return Math.random() * max;
}

function coinFlip() {
    return Math.random() > 0.2;
}

function calculateScalePosition(elementPosition, observerPosition) {
    return {
        x: (elementPosition.x - observerPosition.x) / observerPosition.z,
        y: (elementPosition.y - observerPosition.y) / observerPosition.z,
    };
}

function useViewportSize() {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return size;
}

function Node(props) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const scaledPosition = calculateScalePosition(
            { x: props.position.x, y: props.position.y },
            props.observerPosition,
        );

        setPosition(scaledPosition);
    }, [props.position]);

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    return (
        <div
            className="node"
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${NODE_DIAMETER}px`,
                height: `${NODE_DIAMETER}px`,
                zIndex: "2",
                cursor: "pointer",
                opacity: `${props.focused || props.highlighted ? 1 : UNFOCUSED_OPACITY}`,
                transform: `scale(${(1 / props.observerPosition.z) * (props.focused ? 1.25 : 1)})`,
                transformOrigin: "center",
                transition: "transform 0.3s, opacity 0.3s",
            }}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onMouseMove={stopPropagation}
            onMouseEnter={() => props.focusCallback.enter(props.nodeKey)}
            onMouseLeave={props.focusCallback.exit}
        />
    );
}

export function Hotbar() {
    const width = 60; // vw
    const height = 4; // vh
    const borderRadius = "15px";

    const [open, setOpen] = useState(false);

    return (
        <div
            style={{
                position: "fixed",
                border: "1px solid #ddd",
                borderRadius: borderRadius,
                left: `${(100 - width) / 2}vw`,
                top: `${height / 2}vh`,
                width: `${width}vw`,
                height: `${height}vh`,
                backgroundColor: "white",
                boxShadow: "0px 2px 8px rgba(128, 128, 128, 0.2)",
                display: "flex",
                alignItems: "center",
                zIndex: 10,
            }}
            className="hotbar"
        >
            <div
                style={{
                    height: "100%",
                    borderRadius: borderRadius,
                    cursor: "pointer",
                    zIndex: 11,
                    border: "1px solid #bbb",
                    userSelect: "none",
                }}
                className="newNote"
                onClick={() => setOpen(!open)}
            >
                <img
                    src="/newnote.png"
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: borderRadius,
                    }}
                />
            </div>
            <div
                style={{
                    width: "30%",
                    height: "100%",
                    cursor: "text",
                    borderRadius: borderRadius,
                    display: "flex",
                    alignItems: "center",
                }}
                onClick={() => document.getElementById("searchInput").focus()}
            >
                <input
                    id="searchInput"
                    type="text"
                    placeholder="Search"
                    style={{ marginLeft: "1rem", width: "100%", outline: "0", border: "0" }}
                />
            </div>
        </div>
    );
}

export function Graph(props) {
    const [nodePositions, setNodePositions] = useState([]);
    // this is probably a temporary variable
    const [edges, setEdges] = useState([]);
    const [edgeMap, setEdgeMap] = useState({});

    const [focusKey, setFocusKey] = useState(-1);

    const [mouseDown, setMouseDown] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const viewport = useViewportSize();

    const [observerPosition, setObserverPosition] = useState({
        x: 0,
        y: 0,
        z: 1,
    });

    // grid sizes
    const gridSquareSize = { x: 100, y: 100 };
    const gridSizePixels = { x: viewport.width, y: viewport.height };
    const gridSize = {
        x: Math.floor(gridSizePixels.x / gridSquareSize.x),
        y: Math.floor(gridSizePixels.y / gridSquareSize.y),
    };

    const pixelsToGrid = (pixels) => {
        return [
            Math.min(gridSize.x - 1, Math.floor(pixels.x / gridSquareSize.x)),
            Math.min(gridSize.y - 1, Math.floor(pixels.y / gridSquareSize.y)),
        ];
    };

    // NOTE: this is column-major i.e. index like `occupancyGrid[x][y]`
    const occupancyGrid = new Array(gridSize.x);
    for (let i = 0; i < gridSize.x; i++) {
        occupancyGrid[i] = new Array(gridSize.y).fill(false);
    }

    // { ...position, x: number (pixels), y: number (pixels) }
    const isOccupied = (position) => {
        const [x, y] = pixelsToGrid(position);
        return occupancyGrid[x][y];
    };

    // list of nodes with random positions
    const regenerate = () => {
        for (let x = 0; x < occupancyGrid.length; x++) {
            for (let y = 0; y < occupancyGrid[x].length; y++) {
                occupancyGrid[x][y] = false;
            }
        }

        let newNodes = [];
        for (let i = 0; i < props.count; i++) {
            let candidate = {
                key: i,
                x: getRandom(gridSizePixels.x),
                y: getRandom(gridSizePixels.y),
            };
            while (isOccupied(candidate)) {
                candidate = {
                    ...candidate,
                    x: getRandom(gridSizePixels.x),
                    y: getRandom(gridSizePixels.y),
                };
            }

            const [x, y] = pixelsToGrid(candidate);
            occupancyGrid[x][y] = true;
            newNodes.push(candidate);
        }

        setNodePositions(newNodes);
        setEdges(generateEdges(newNodes));
    };

    // create edge elements from list of positions
    const generateEdges = (positions) => {
        let edges = [];
        let edgeMap = {};
        for (let i = 0; i < positions.length; i++) {
            const p1 = positions[i];
            edgeMap[p1.key] = [];
            for (let j = 0; j < positions.length; j++) {
                if (i !== j && coinFlip()) {
                    const p2 = positions[j];
                    const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

                    edges.push({ from: p1.key, to: p2.key, length, angle, x: p1.x, y: p1.y });
                    edgeMap[p1.key].push(p2.key);
                }
            }
        }

        setEdgeMap(edgeMap);

        return edges;
    };

    useEffect(() => {
        regenerate();
    }, [props.count]);

    const onMouseMove = (event) => {
        if (mouseDown) {
            const newOffset = { x: event.pageX - mouseDown.x, y: event.pageY - mouseDown.y };
            setDragOffset(newOffset);
        }
    };

    const handleWheel = (event) => {
        console.log("scroll", event);
        const direction = event.deltaY > 0 ? 1 : -1;

        const z = Math.max(0.2, Math.min(2, observerPosition.z + direction * 0.1));

        setObserverPosition({ ...observerPosition, z });
    };

    const applyOffset = (position) => {
        return { ...position, x: position.x - dragOffset.x, y: position.y - dragOffset.y };
    };

    return (
        <>
            <div
                style={{
                    width: `${gridSizePixels.x}px`,
                    height: `${gridSizePixels.y}px`,
                    cursor: mouseDown ? "grabbing" : "grab",
                    overflow: "hidden",
                }}
                onMouseDown={(event) => setMouseDown({ x: event.pageX, y: event.pageY })}
                onMouseUp={() => {
                    /*setNodePositions(
                        nodePositions.map((p) => ({
                            ...p,
                            x: p.x + dragOffset.x,
                            y: p.y + dragOffset.y,
                        })),
                    );

                    setEdges(
                        edges.map((e) => ({
                            ...e,
                            x: e.x + dragOffset.x,
                            y: e.y + dragffset.y,
                        })),
                    );*/

                    setObserverPosition(applyOffset(observerPosition));

                    setMouseDown(null);
                    setDragOffset({ x: 0, y: 0 });
                }}
                onMouseMove={onMouseMove}
                onWheel={handleWheel}
            >
                {nodePositions.map((position, index) => (
                    <Node
                        key={index}
                        nodeKey={index}
                        position={{ x: position.x, y: position.y }}
                        observerPosition={applyOffset(observerPosition)}
                        focusCallback={{
                            enter: (key) => {
                                setFocusKey(key);
                            },
                            exit: () => setFocusKey(-1),
                        }}
                        focused={index === focusKey}
                        highlighted={focusKey === -1 || edgeMap[focusKey].includes(index)}
                    />
                ))}
                {edges.map((e) => {
                    const edgePosition = calculateScalePosition(
                        {
                            x: e.x,
                            y: e.y,
                        },
                        applyOffset(observerPosition),
                    );

                    // can we explain the math in `transform: translate(...)` ???
                    // why can't this be taken care of in `calculateScalePosition`
                    return (
                        <div
                            style={{
                                zIndex: "1",
                                transformOrigin: "top left",
                                transform: `scale(${1 / observerPosition.z}) translate(${(edgePosition.x + NODE_DIAMETER / 2) * observerPosition.z}px, ${(edgePosition.y + NODE_DIAMETER / 2) * observerPosition.z}px) rotate(${e.angle}deg)`,
                                width: `${e.length}px`,
                                height: "2px",
                                left: "0",
                                top: "0",
                                opacity:
                                    e.from === focusKey || focusKey === -1
                                        ? "1"
                                        : `${UNFOCUSED_OPACITY}`,
                                position: "absolute",
                                backgroundColor: e.from === focusKey ? "#444" : "#888",
                                transition: "opacity 0.3s, background-color 0.3s",
                            }}
                        />
                    );
                })}
            </div>
        </>
    );
}
