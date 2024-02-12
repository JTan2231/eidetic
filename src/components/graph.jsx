import { useState, useEffect } from "react";
import "../styles/graph.css";

const NODE_DIAMETER = 50;
const UNFOCUSED_OPACITY = 0.1;

function getRandom(max) {
    return Math.random() * max;
}

function coinFlip() {
    return Math.random() > 0.8;
}

function Node(props) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setPosition(props.position);
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
                opacity: `${props.opacity}`,
            }}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onMouseMove={stopPropagation}
            onMouseEnter={() => props.focusCallback.enter(props.nodeKey)}
            onMouseLeave={props.focusCallback.exit}
        />
    );
}

export function Graph(props) {
    const [nodePositions, setNodePositions] = useState([]);
    // this is probably a temporary variable
    const [edges, setEdges] = useState([]);
    const [edgeMap, setEdgeMap] = useState({});
    const [mouseDown, setMouseDown] = useState(null);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [focusKey, setFocusKey] = useState(-1);

    // grid sizes
    const gridSquareSize = { x: 100, y: 100 };
    const gridSizePixels = { x: window.innerWidth - 100, y: window.innerHeight - 50 };
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
        for (let i = 0; i < 10; i++) {
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

    const onMouseMove = (event) => {
        if (mouseDown) {
            const newOffset = { x: event.pageX - mouseDown.x, y: event.pageY - mouseDown.y };
            setDragOffset(newOffset);
        }
    };

    return (
        <>
            <div
                style={{
                    border: "1px solid black",
                    width: `${gridSizePixels.x}px`,
                    height: `${gridSizePixels.y}px`,
                    cursor: mouseDown ? "grabbing" : "grab",
                }}
                onMouseDown={(event) => setMouseDown({ x: event.pageX, y: event.pageY })}
                onMouseUp={() => {
                    setNodePositions(
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
                            y: e.y + dragOffset.y,
                        })),
                    );

                    setMouseDown(null);
                    setDragOffset({ x: 0, y: 0 });
                }}
                onMouseMove={onMouseMove}
            >
                {nodePositions.map((position, index) => (
                    <Node
                        key={index}
                        nodeKey={index}
                        position={{ x: position.x + dragOffset.x, y: position.y + dragOffset.y }}
                        focusCallback={{
                            enter: (key) => {
                                setFocusKey(key);
                            },
                            exit: () => setFocusKey(-1),
                        }}
                        opacity={
                            focusKey === -1 ||
                            index === focusKey ||
                            edgeMap[focusKey].includes(index)
                                ? 1
                                : UNFOCUSED_OPACITY
                        }
                    />
                ))}
                {edges.map((e) => {
                    return (
                        <div
                            style={{
                                zIndex: "1",
                                transformOrigin: "top left",
                                transform: `translate(${e.x + dragOffset.x + NODE_DIAMETER / 2}px, ${e.y + dragOffset.y + NODE_DIAMETER / 2}px) rotate(${e.angle}deg)`,
                                width: `${e.length}px`,
                                height: "2px",
                                left: "0",
                                top: "0",
                                opacity:
                                    e.from === focusKey || focusKey === -1
                                        ? "1"
                                        : `${UNFOCUSED_OPACITY}`,
                                position: "absolute",
                                backgroundColor: "#888",
                            }}
                        />
                    );
                })}
            </div>
            <button onClick={regenerate}>regen</button>
        </>
    );
}
