import { useState, useCallback, useEffect } from 'react';
import ReactFlow,{ ReactFlowProvider, useReactFlow , Controls,addEdge, Background, applyNodeChanges, applyEdgeChanges,removeElements } from 'reactflow';
import 'reactflow/dist/style.css';
import Navbar from './components/Navbar';
import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
//  import Button 
import Button from '@mui/material/Button';

const initialNodes = [];

const initialEdges = [];
var nodeId = 0;
function Flow(props){
     
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState(initialNodes); // use state variable for the nodes 
  const [edges, setEdges] = useState(initialEdges); // use state variable for the edges
 
  function getNodeObject(id){
    const node_object = {
      id: id,
      data: { label: `SC ${id}` },
      position: { x: 300, y: 200 },
    }  
    return node_object;
  }
  const addNode = useCallback(() => {
    const id = `${++nodeId}`;
    const newNode = {
      id,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: {
        label: `SC ${id}`,
      },
    };
    reactFlowInstance.addNodes(newNode);
  }, []);

function displayInfo(){
  console.log(nodes);
  console.log(edges);
} 
const deleteNodeById = (id) => {
  // connect all parents to all children
  // find parents
  const parentsedges = edges.filter(edge => edge.target === id);
  // find children
  const childrenedges = edges.filter(edge => edge.source === id);
  // go through every parentedge and every child edge and create a new edge between the source of the parent and the target of the child
  parentsedges.forEach(parentedge => {
    childrenedges.forEach(childedge => {
      const newedge = {
        id: `reactflow__edge-${parentedge.source}-${childedge.target}`,
        source: parentedge.source,
        target: childedge.target,
      };
      reactFlowInstance.addEdges(newedge);
    });
  });
  // delete the node
setNodes(nds => nds.filter(node => node.id !== id));
  // delete all edges that were connected to the node
  const edgesToDelete = edges.filter(edge => edge.source === id || edge.target === id);
  setEdges(eds => eds.filter(edge => !edgesToDelete.includes(edge))); 
};

const onNodesChange = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  []
);
const onEdgesChange = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  []
);
const handleNodeContextMenu = (event, node) => {
    event.preventDefault(); // prevent default context menu
    deleteNodeById(node.id);
  };
const handleEdgeContextMenu = (event, edge) => {
  event.preventDefault(); // prevent default context menu
  setEdges(eds => eds.filter(ed => ed.id !== edge.id));
};
const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    
      <Grid container sx = {{height: '100vh'}} spacing={2}>       
      
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
      backgroundColor: '#D3D2E5',
    }}>
    
    <Background />
    <Controls />
   </ReactFlow>
   </Grid>
    <Grid item xs={4} marginTop={10}>

    <Button variant='contained' onClick={addNode}> Add a Node</Button>
    <Button variant='contained' onClick={displayInfo}> Display Info </Button>
    </Grid>
    </Grid>
  );
}
function App() {
  // const [nodes, setNodes] = React.useState([]);
    return (
    <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <div style={{ height: '100%' }}>
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
  
        
    </Box>
  );
}

export default App;
