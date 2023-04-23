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

function inverseMod(num, m) {
  let [a, b, x, y] = [num, m, 1, 0];
  while (a !== 1) {
    const q = Math.floor(b / a);
    [a, b, x, y] = [b % a, a, y - q * x, x];
  }
  return (x % m + m) % m;
}

const initialEdges = [];
var nodeId = 0;
var root = null;
var adj = {};
var val = {};
function Flow(props) {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState(initialNodes); // use state variable for the nodes
  const [edges, setEdges] = useState(initialEdges); // use state variable for the edges

  const generateRandomKey = () => {
    return Math.floor(Math.random() * 1000000);
  };  

  const groupAddition = (P, Q) => {
    console.log(P, Q);
    const xp = parseInt(P.x, 10)
    const yp = parseInt(P.y, 10)
    const xq = parseInt(Q.x, 10)
    const yq = parseInt(Q.y, 10)
    const a = parseInt(ECDLPParameters.a, 10)
    const p = parseInt(ECDLPParameters.p, 10)

    let xr, yr
    console.log("Entry")
    if (P === Q) {
        // P = Q case
        const lambda = (((3 * xp * xp + a) * inverseMod(2 * yp, p) % p) + p) % p;
        xr = (lambda * lambda - xp - xq) % p
        yr = (lambda * (xp - xr) - yp) % p
    } else {
        // P != Q case
        const lambda = ((((yq - yp) * inverseMod(xq - xp, p) % p) + p) % p);
        xr = (lambda * lambda - xp - xq) % p
        yr = (lambda * (xp - xr) - yp) % p
    }
    console.log("Exit")
    xr = (xr + p) % p; 
    yr = (yr + p) % p;
    return { x: xr, y: yr }
  }


  const groupMultiplication = (s,G) => {
    // perform multiplication by repeated addition
    if(s == 1) return G;
    let result = G;
    for (let i = 1; i < s; i++) {
      result = groupAddition(result, G);
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

  function recompute(id) {
    let visited = new Set();
    const psi = [];
    const p = parseInt(ECDLPParameters.p, 10)
    const dfs = (v) => {
      if(visited.has(v)) return false;
      visited.add(v);
      console.log("DFS: ");
      console.log(v);
      console.log(val[v]);
      psi.push(val[v].subSecretKey % p)
      if(v == id){
        const nfn = [];
        for(let s of psi){
          const sG = groupMultiplication(s, val[v].basePoint);
          const concatStr = sG.x.toString(2) + sG.y.toString(2);
          nfn.push(parseInt(sha256(concatStr), 16))
        }
        val[id].fn = nfn;
      }
      for(let to of adj[v])
        if(dfs(to)) return true;
      psi.pop();
      return false;
    }
    dfs(root);
    console.log(val)
  }

  //  adding a new security class 
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      const u = parseInt(params.source, 10), v = parseInt(params.target, 10);
      adj[u].push(v);
      // Now, v is first updated with all ancestor information
      recompute(v);
      // Then, all descendants of v are updated
      // propagate(v);
  },
    []
  );
  
  const addNode = useCallback(() => {
    const id = `${++nodeId}`;
    const secretKey = generateRandomKey();
    const newNode = {
      id,
      position: {
        x: 500,
        y: 500,
      },
      data: {
        label: `SC ${id}`,
      },
    };
    const nodeVal = {
      id: id,
      basePoint : ECDLPParameters.points[Math.floor(Math.random() * ECDLPParameters.points.length)],
      secretKey: secretKey, // ski
      fn : [],
      subSecretKey: generateRandomKey(), // si
    }
    console.log("Root: ", root)
    if (root === null) {
      //  set the root node
      root = id;
    }
    adj[id] = [];
    val[id] = nodeVal;
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
