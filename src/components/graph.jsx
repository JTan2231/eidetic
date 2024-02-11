import { useState, useEffect } from "react";
import "../styles/graph.css";

const NODE_DIAMETER = 50;

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

    return (
        <div
            key={props.key}
            className="node"
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${NODE_DIAMETER}px`,
                height: `${NODE_DIAMETER}px`,
                zIndex: "2",
            }}
        />
    );
}

export function Graph(props) {
    const [nodePositions, setNodePositions] = useState([]);
    // this is probably a temporary variable
    const [edges, setEdges] = useState([]);
    const [mouseDown, setMouseDown] = useState(null);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

    // { x: number (pixels), y: number (pixels) }
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
            let candidate = { x: getRandom(gridSizePixels.x), y: getRandom(gridSizePixels.y) };
            while (isOccupied(candidate)) {
                candidate = { x: getRandom(gridSizePixels.x), y: getRandom(gridSizePixels.y) };
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
        for (let i = 0; i < positions.length; i++) {
            for (let j = 0; j < positions.length; j++) {
                if (i != j && coinFlip()) {
                    const [p1, p2] = [positions[i], positions[j]];
                    const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

                    edges.push({ length, angle, x: p1.x, y: p1.y });
                }
            }
        }

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

                    console.log(edges);

                    setMouseDown(null);
                    setDragOffset({ x: 0, y: 0 });
                }}
                onMouseMove={onMouseMove}
            >
                {nodePositions.map((position, index) => (
                    <Node
                        key={index}
                        position={{ x: position.x + dragOffset.x, y: position.y + dragOffset.y }}
                    />
                ))}
                {edges.map((e) => (
                    <div
                        style={{
                            zIndex: "1",
                            transformOrigin: "top left",
                            transform: `translate(${e.x + dragOffset.x + 25}px, ${e.y + dragOffset.y + 25}px) rotate(${e.angle}deg)`,
                            width: `${e.length}px`,
                            height: "2px",
                            left: "0",
                            top: "0",
                            position: "absolute",
                            backgroundColor: "#ddd",
                        }}
                    />
                ))}
            </div>
            <button onClick={regenerate}>regen</button>
        </>
    );
}
