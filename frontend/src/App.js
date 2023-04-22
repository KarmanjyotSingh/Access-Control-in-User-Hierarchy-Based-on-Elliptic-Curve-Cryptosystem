import { useState, useCallback, useEffect } from "react";
import sha256 from "crypto-js/sha256";
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  Controls,
  addEdge,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  removeElements,
} from "reactflow";

import "reactflow/dist/style.css";
import Navbar from "./components/Navbar";
import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
//  import Button
import Button from "@mui/material/Button";

const initialNodes = [];

const ECDLPParameters = {
  p: 23,
  a: 1,
  b: 1,
  points: [
    { x: 0, y: 1 },
    { x: 1, y: 16 },
    { x: 4, y: 0 },
    { x: 6, y: 4 },
    { x: 7, y: 12 },
    { x: 11, y: 3 },
    { x: 12, y: 19 },
    { x: 17, y: 3 },
    { x: 18, y: 20 },
    { x: 0, y: 22 },
    { x: 3, y: 10 },
    { x: 5, y: 4 },
    { x: 6, y: 19 },
    { x: 9, y: 7 },
    { x: 11, y: 20 },
    { x: 13, y: 7 },
    { x: 17, y: 20 },
    { x: 19, y: 5 },
    { x: 1, y: 7 },
    { x: 3, y: 13 },
    { x: 5, y: 19 },
    { x: 7, y: 11 },
    { x: 9, y: 16 },
    { x: 12, y: 4 },
    { x: 13, y: 16 },
    { x: 18, y: 3 },
    { x: 19, y: 18 },
  ],
};

const initialEdges = [];
var nodeId = 0;
function Flow(props) {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState(initialNodes); // use state variable for the nodes
  const [edges, setEdges] = useState(initialEdges); // use state variable for the edges

  const [rootNode, setRootNode] = useState(null);
  const generateRandomKey = () => {
    return Math.floor(Math.random() * 1000000);
  };  
  const groupAddition = (s,G) => {
    //  P = Q case only 
    const xp = parseInt(G.x,10)
    const yp = parseInt(G.y,10)
    const a = parseInt(ECDLPParameters.a,10)
    const p = parseInt(ECDLPParameters.p,10)

    const lambda = parseInt((Math.floor((3 * xp * xp + a)/2*yp )) % p,10)
    const xr = (lambda * lambda - 2 * xp) % p
    const yr = (lambda * (xp - xr) - yp) % p
    return {x:xr,y:yr}
  }
  const groupMultiplication = (s,G) => {
    // perform multiplication by repeated addition
    let result = {x:0,y:0};
    for (let i = 0; i < s; i++) {
      result = groupAddition(result,G);
    }
    return result; 
  }
 
  const buildRelationShip = (id) => {
    // return an array of vertices, from which node id can be reached
    return []
  }
  const keyGenerationPhase = (j) => {

    const filteredEdges = buildRelationShip(j); 
    const nodej = nodes.filter((node) => node.id === j);
    // make an array for all edges
    let coefficients = [];
    filteredEdges.forEach((source) => {
      const i = source;
      const nodei = nodes.filter((node) => node.id === i);
      const si = nodei.subSecretKey;
      const result = groupMultiplication(si,nodej.basePoint);
        // convert result.x and result.y to binary
        const xji = result.x.toString(2);
        const yji = result.y.toString(2);
        //  concatenate xji and yji
        const xjiyji = xji + yji;
        //  hash xjiyji
        let hash = sha256(xjiyji);
        //  convert hash to decimal
         hash = parseInt(hash, 16);
        coefficients.push(hash);
    });
    return coefficients;
  }
  //  adding a new security class 
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds))
  },
    []
  );
  const dfs = (node, visited,visitedNodes) => {
    //  store all the nodes that can be reached from the root node
    visited[node.id] = true;
    visitedNodes.push(node.id);
    const filteredEdges = edges.filter((edge) => edge.source === node.id);
    filteredEdges.forEach((edge) => {
      const targetNode = nodes.filter((node) => node.id === edge.target);
      if (!visited[targetNode.id]) {
        dfs(targetNode, visited);
      }
    });
  }
  const insertNewClass = (id) => {
    
    let coefficients = keyGenerationPhase(id);
    const Rik = buildRelationShip(id);
    const nodek = nodes.filter((node) => node.id === id);
    const copyNodes = [...nodes];
    copyNodes[nodek].coefficients = coefficients;
    setNodes(copyNodes);

    let Rjk = [];
    dfs(nodek,{},Rjk);

    Rik.forEach((i) => {
      const nodei = nodes.filter((node) => node.id === i);
      let x = [];
      let visited = {};
      dfs(nodei,visited,x);
      x.pop();
      Rjk.forEach((j) => {
        if (x.includes(j)) {
          const copyNodes = [...nodes];
          const nodej = copyNodes.filter((node) => node.id === j);
          const coefficients = keyGenerationPhase(j);
          copyNodes[nodej].coefficients = coefficients ;
          setNodes(copyNodes);
        }
      });
    });
  };
  
  const addNode = useCallback(() => {
    const id = `${++nodeId}`;
    const newNode = {
      id,
      position: {
        x: 500,
        y: 500,
      },
      functionCoefficients : keyGenerationPhase(id),
      basePoint : ECDLPParameters.points[Math.floor(Math.random() * ECDLPParameters.points.length)],
      secretKey: generateRandomKey(), // ski
      subSecretKey: generateRandomKey(), // si
      data: {
        label: `SC ${id}`,
      },
    };
    if (rootNode == null) {
      //  set the root node
      setRootNode(newNode);
    }
    reactFlowInstance.addNodes(newNode);
  }, []);

  function displayInfo() {
    console.log(nodes);
    console.log(edges);
  }
  const deleteNodeById = (id) => {
    // connect all parents to all children
    // find parents
    const parentsedges = edges.filter((edge) => edge.target === id);
    // find children
    const childrenedges = edges.filter((edge) => edge.source === id);
    // go through every parentedge and every child edge and create a new edge between the source of the parent and the target of the child
    parentsedges.forEach((parentedge) => {
      childrenedges.forEach((childedge) => {
        const newedge = {
          id: `reactflow__edge-${parentedge.source}-${childedge.target}`,
          source: parentedge.source,
          target: childedge.target,
        };
        reactFlowInstance.addEdges(newedge);
      });
    });
    // delete the node
    setNodes((nds) => nds.filter((node) => node.id !== id));
    // delete all edges that were connected to the node
    const edgesToDelete = edges.filter(
      (edge) => edge.source === id || edge.target === id
    );
    setEdges((eds) => eds.filter((edge) => !edgesToDelete.includes(edge)));
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback( 
    (changes) =>{ 
      setEdges((eds) => applyEdgeChanges(changes, eds))
      console.log(changes);
    },
    []
  );
  const handleNodeContextMenu = (event, node) => {
    event.preventDefault(); // prevent default context menu
    deleteNodeById(node.id);
  };
  const handleEdgeContextMenu = (event, edge) => {
    event.preventDefault(); // prevent default context menu
    setEdges((eds) => eds.filter((ed) => ed.id !== edge.id));
  };
  
  
  return (
    <Grid container sx={{ height: "100vh" }} spacing={2}>
      <Grid item xs={8}>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          fitView
          style={{
            backgroundColor: "#D3D2E5",
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Grid>
      <Grid item xs={4} marginTop={10}>
        <Button variant="contained" onClick={addNode}>
          {" "}
          Add a Node
        </Button>
        <Button variant="contained" onClick={displayInfo}>
          {" "}
          Display Info{" "}
        </Button>
      </Grid>
    </Grid>
  );
};
function App() {
  //  maintain graph as set of nodes and edges

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      <div style={{ height: "100%" }}>
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
    </Box>
  );
}

export default App;
