import { useState, useEffect } from 'react';
import '../styles/graph.css';

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
        <div key={props.key} className="node" style={{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, zIndex: '2' }} />
    );
}

export function Graph(props) {
    const [nodePositions, setNodePositions] = useState([]);

    // grid sizes
    const gridSquareSize = { x: 100, y: 100 };
    const gridSizePixels = { x: window.innerWidth - 500, y: window.innerHeight - 250 };
    const gridSize = { x: Math.floor(gridSizePixels.x / gridSquareSize.x), y: Math.floor(gridSizePixels.y / gridSquareSize.y) };

    const pixelsToGrid = (pixels) => {
        return [Math.min(gridSize.x - 1, Math.floor(pixels.x / gridSquareSize.x)), Math.min(gridSize.y - 1, Math.floor(pixels.y / gridSquareSize.y))];
    }

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
    };

    const generateEdges = () => {
        let edges = [];
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = 0; j < nodePositions.length; j++) {
                if (i != j && coinFlip()) {
                    const [p1, p2] = [nodePositions[i], nodePositions[j]];
                    const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
                    const transform = `translate(${p1.x + 25}px, ${p1.y + 25}px) rotate(${angle}deg)`;

                    edges.push(<div style={{ zIndex: '1', transformOrigin: 'top left', transform: transform, width: `${length}px`, height: '2px', left: '0', top: '0', position: 'absolute', backgroundColor: '#ddd' }} />);
                }
            }
        }

        return edges;
    };

    useEffect(() => {
        regenerate();
    }, [props]);

    return (
        <>
            <div style={{ border: '1px solid black', width: `${gridSizePixels.x}px`, height: `${gridSizePixels.y}px` }}>
                {nodePositions.map((position, index) => <Node key={index} position={position} />)}
                {generateEdges()}
            </div>
            <button onClick={regenerate}>regen</button>
        </>
    );
}
