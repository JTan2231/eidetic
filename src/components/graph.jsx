import { useState, useEffect } from "react";
import "../styles/graph.css";

const NODE_DIAMETER = 100;
const UNFOCUSED_OPACITY = 0.15;

const API_URL = "http://localhost:5000/";

const TRANSLUSCENT_WHITE = "rgba(255, 255, 255, 0.95)";

function getRandom(max) {
    return Math.random() * max;
}

function coinFlip() {
    return Math.random() > 0.999;
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

function stopPropagation(event) {
    event.stopPropagation();
}

export function Hotbar(props) {
    const width = 60; // vw
    const height = 4; // vh
    const borderRadius = "15px";

    const transitionSpeed = 0.4; // s

    const newNoteHotbarRatio = 0.4;
    const openHeight = 30; // vh
    const textareaMargin = 1; // rem

    const [open, setOpen] = useState(false);
    const [modalShowing, setModalShowing] = useState(false);

    const modalSuccess = <span>Note added successfully</span>;
    const modalFailure = <span>Failed to add note</span>;

    const [modalMessage, setModalMessage] = useState(modalSuccess);

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    borderRadius: borderRadius,
                    left: `${(100 - width) / 2}vw`,
                    top: `${height / 2}vh`,
                    width: `${width}vw`,
                    height: `${height}vh`,
                    backgroundColor: TRANSLUSCENT_WHITE,
                    boxShadow: "0px 2px 8px rgba(128, 128, 128, 0.2)",
                    display: "flex",
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        cursor: "pointer",
                        zIndex: 11,
                        userSelect: "none",
                        overflow: "hidden",
                        borderRadius: borderRadius,
                        display: "flex",
                        flexDirection: "column",
                        transition: `all ${transitionSpeed}s`,
                        backgroundColor: TRANSLUSCENT_WHITE,
                        width: open ? `${newNoteHotbarRatio * 100}%` : `${height}vh`,
                        height: open ? `${openHeight}vh` : `${height}vh`,
                        border: open ? "1px solid #bbb" : "",
                    }}
                    className={"newNote" + (open ? " newNoteHover" : "")}
                    onClick={() => setOpen(!open)}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                            src="/newnote.png"
                            style={{
                                maxWidth: "100%",
                                width: "auto",
                                height: `${height}vh`,
                                objectFit: "cover",
                                display: "block",
                                flexGrow: "0",
                                borderRadius: borderRadius,
                            }}
                        />
                        <span
                            style={{
                                flexGrow: "1",
                                textWrap: "nowrap",
                                opacity: open ? 1 : 0,
                                transition: "all 0.5s",
                            }}
                        >
                            Create a new note
                        </span>
                    </div>

                    <textarea
                        id="newNoteInput"
                        placeholder="Shift + Enter for line break"
                        onClick={stopPropagation}
                        style={{
                            outline: "0",
                            border: "0",
                            padding: "0",
                            transition: `all ${transitionSpeed}s`,
                            opacity: open ? 1 : 0,
                            fontSize: "16px",
                            width: `calc(${width * newNoteHotbarRatio}vw - ${2 * textareaMargin}rem)`,
                            height: `calc(${openHeight}vh - ${2 * textareaMargin}rem)`,
                            margin: `${textareaMargin}rem`,
                            resize: "none",
                            backgroundColor: "rgba(255, 255, 255, 0)",
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                setModalShowing(true);

                                fetch(`${API_URL}add-note`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "http://localhost:3000",
                                    },
                                    body: JSON.stringify({
                                        content: document.getElementById("newNoteInput").value,
                                    }),
                                })
                                    // TODO: failure modal
                                    .then((res) => {
                                        if (res.status === 201) {
                                            // success modal

                                            setTimeout(() => {
                                                setModalShowing(false);
                                            }, 3000);

                                            document.getElementById("newNoteInput").value = "";
                                            setOpen(false);

                                            props.refreshNodes();
                                        }
                                    })
                                    .catch(() => setModalMessage(modalFailure));
                            }
                        }}
                    />
                </div>
                <div
                    style={{
                        cursor: "text",
                        borderRadius: borderRadius,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexGrow: 1,
                        overflow: "none",
                        maxWidth: "100%",
                    }}
                    onClick={() => document.getElementById("searchInput").focus()}
                >
                    <input
                        id="searchInput"
                        type="text"
                        placeholder="Search"
                        onChange={(event) => props.searchCallback(event.target.value)}
                        style={{
                            marginLeft: "1rem",
                            width: "100%",
                            minHeight: "100%",
                            outline: "0",
                            border: "0",
                            backgroundColor: "rgba(255, 255, 255, 0)",
                        }}
                    />
                    <div
                        style={{
                            maxWidth: "100%",
                            backgroundColor: TRANSLUSCENT_WHITE,
                            borderRadius: borderRadius,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {props.filteredContent.map((c) => (
                            <div
                                style={{
                                    padding: "0.75rem 1rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    minWidth: 0,
                                    borderBottom: "1px solid #ddd",
                                }}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div
                style={{
                    display: "block",
                    position: "fixed",
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: `${2 * height}vh`,
                    border: "1px solid black",
                    borderRadius: borderRadius,
                    zIndex: modalShowing ? 10 : -1,
                    backgroundColor: TRANSLUSCENT_WHITE,
                    padding: "0.5rem 0.5rem",
                    userSelect: "none",
                    opacity: modalShowing ? 1 : 0,
                    transition: `all ${transitionSpeed}s`,
                }}
            >
                <span
                    style={{ margin: "0 1rem 0 0", cursor: "pointer" }}
                    onClick={() => setModalShowing(false)}
                >
                    X
                </span>
                {modalMessage}
            </div>
        </>
    );
}

export function Graph(props) {
    const [nodePositions, setNodePositions] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [filteredContent, setFilteredContent] = useState([]);

    const [focusKey, setFocusKey] = useState(-1);
    const [openNode, setOpenNode] = useState(-1);

    const [mouseDown, setMouseDown] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const viewport = useViewportSize();

    const [observerPosition, setObserverPosition] = useState({
        x: 0,
        y: 0,
        z: 1,
    });

    const refreshNodes = () => {
        fetch(`${API_URL}get-notes?user_id=${2}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                regenerateNodes(data);
            })
            .catch((error) => console.log(error));
    };

    // list of nodes with random positions
    const regenerateNodes = (data) => {
        const notes = data.nodes;

        let newNodes = [];
        const nodeMap = {};
        const edgeMap = {};
        for (let i = 0; i < notes.length; i++) {
            nodeMap[notes[i].id] = i;
            edgeMap[notes[i].id] = [notes[i].id];
            newNodes.push({
                key: notes[i].id,
                content: notes[i].content,
                x: (notes[i].position[0] / 100) * viewport.width,
                y: (notes[i].position[1] / 100) * viewport.height,
            });
        }

        setNodePositions(newNodes);

        /*const edgeList = data.edges;
        const newEdges = [];
        for (let i = 0; i < edgeList.length; i++) {
            const current = edgeList[i][0];
            const neighbors = edgeList[i][1];
            const p1 = newNodes[nodeMap[current]];
            edgeMap[p1.key] = [];
            for (let j = 0; j < neighbors.length; j++) {
                console.log(current, neighbors[j]);
                const p2 = newNodes[nodeMap[neighbors[j]]];
                const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

                newEdges.push({ from: p1.key, to: p2.key, length, angle, x: p1.x, y: p1.y });
                edgeMap[p1.key].push(p2.key);
            }
        }

        setEdges(newEdges);
        setEdgeMap(edgeMap);*/
    };

    useEffect(() => {
        refreshNodes();
    }, [props.count]);

    const onMouseMove = (event) => {
        if (mouseDown) {
            const newOffset = {
                x: observerPosition.z * (event.pageX - mouseDown.x),
                y: observerPosition.z * (event.pageY - mouseDown.y),
            };
            setDragOffset(newOffset);
        }
    };

    const handleWheel = (event) => {
        const scaleMax = 10;
        const scaleMin = 0.2;
        const scrollInterval = 0.2;

        const direction = event.deltaY > 0 ? 1 : -1;
        const z = Math.max(
            scaleMin,
            Math.min(scaleMax, observerPosition.z + direction * scrollInterval),
        );

        setObserverPosition({ ...observerPosition, z });
    };

    const applyOffset = (position) => {
        return { ...position, x: position.x - dragOffset.x, y: position.y - dragOffset.y };
    };

    const determineHighlighted = (position, index) => {
        if (searchQuery.length > 0) {
            return position.content.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
            return focusKey === -1; // || edgeMap[focusKey].includes(index);
        }
    };

    return (
        <>
            <div style={{ position: "fixed", left: 0, top: 0 }}>
                <input id="channelInput" type="text" />
                <button
                    onClick={() => {
                        fetch(`${API_URL}import-channel`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "http://localhost:3000",
                            },
                            body: JSON.stringify({
                                channel: document.getElementById("channelInput").value,
                            }),
                        });
                    }}
                >
                    import
                </button>
            </div>
            <Hotbar
                refreshNodes={refreshNodes}
                searchCallback={(query) => {
                    setFilteredContent(
                        query.length > 0
                            ? nodePositions
                                  .map((p) => p.content)
                                  .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
                            : [],
                    );
                    setSearchQuery(query);
                }}
                filteredContent={filteredContent}
            />
            <div
                style={{
                    backgroundColor: "rgba(128, 128, 128, 0.4)",
                    position: "fixed",
                    width: "100vw",
                    height: "100vh",
                    display: openNode !== -1 ? "block" : "none",
                    zIndex: 998,
                    cursor: "pointer",
                }}
                onClick={() => setOpenNode(-1)}
            />
            <div
                style={{
                    width: `${viewport.width}px`,
                    height: `${viewport.height}px`,
                    cursor: mouseDown ? "grabbing" : "grab",
                    overflow: "hidden",
                    zIndex: 1,
                }}
                onMouseDown={(event) => setMouseDown({ x: event.pageX, y: event.pageY })}
                onMouseUp={() => {
                    setObserverPosition(applyOffset(observerPosition));

                    setMouseDown(null);
                    setDragOffset({ x: 0, y: 0 });
                }}
                onMouseMove={onMouseMove}
                onWheel={handleWheel}
            >
                {nodePositions.map((position, index) => {
                    const scaledPosition = calculateScalePosition(
                        { x: position.x, y: position.y },
                        applyOffset(observerPosition),
                    );

                    const unopenedStyle = {
                        position: "fixed",
                        left: 0,
                        top: 0,
                        width: `${NODE_DIAMETER}px`,
                        height: `${NODE_DIAMETER}px`,
                        zIndex: mouseDown ? -1 : 2,
                        cursor: "pointer",
                        border: "1px solid #444",
                        borderRadius: "12px",
                        backgroundColor: "white",
                        userSelect: "none",
                        opacity: `${position.key === focusKey || determineHighlighted(position, position.key) ? 1 : UNFOCUSED_OPACITY}`,
                        transform: `translate(${scaledPosition.x}px, ${scaledPosition.y}px)`,
                        transition: "opacity 0.3s",
                        overflow: "hidden",
                        padding: "0.5rem",
                        textOverflow: "ellipsis",
                    };

                    const openedStyle = {
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: `30vw`,
                        height: `30vh`,
                        zIndex: 999,
                        border: "1px solid #444",
                        borderRadius: "12px",
                        backgroundColor: "white",
                        userSelect: "none",
                        padding: "2rem",
                        cursor: "default",
                    };

                    const focusEnterCallback = (key) => setFocusKey(key);
                    const exitFocusCallback = () => setFocusKey(-1);

                    return (
                        <div
                            style={position.key === openNode ? openedStyle : unopenedStyle}
                            onMouseDown={stopPropagation}
                            onMouseUp={stopPropagation}
                            onMouseMove={stopPropagation}
                            onMouseEnter={
                                position.key === openNode
                                    ? undefined
                                    : () => focusEnterCallback(position.key)
                            }
                            onMouseLeave={position.key === openNode ? undefined : exitFocusCallback}
                            onClick={() => {
                                exitFocusCallback();
                                setOpenNode(position.key);
                            }}
                        >
                            {position.content}
                        </div>
                    );
                })}
                {/*edges.map((e) => {
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
                                zIndex: mouseDown ? -2 : 1,
                                transformOrigin: "top left",
                                transform: `scale(${1 / observerPosition.z}) translate(${(edgePosition.x + NODE_DIAMETER / 2) * observerPosition.z}px, ${(edgePosition.y + NODE_DIAMETER / 2) * observerPosition.z}px) rotate(${e.angle}deg)`,
                                width: `${e.length}px`,
                                height: "2px",
                                left: "0",
                                top: "0",
                                opacity:
                                    (e.from === focusKey || focusKey === -1) &&
                                    searchQuery.length === 0
                                        ? "1"
                                        : `${UNFOCUSED_OPACITY}`,
                                position: "absolute",
                                backgroundColor: e.from === focusKey ? "#444" : "#888",
                                transition: "opacity 0.3s, background-color 0.3s",
                            }}
                        />
                    );
                })*/}
            </div>
        </>
    );
}
