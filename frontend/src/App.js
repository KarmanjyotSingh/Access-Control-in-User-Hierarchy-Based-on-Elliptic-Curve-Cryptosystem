import { useState, useCallback } from 'react';
import ReactFlow,{ ReactFlowProvider, useReactFlow , Controls,addEdge, Background, applyNodeChanges, applyEdgeChanges } from 'reactflow';
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
      data: { label: `Node ${id}` },
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
        label: `Node ${id}`,
      },
    };
    reactFlowInstance.addNodes(newNode);
  }, []);


const onNodesChange = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  []
);
const onEdgesChange = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  []
);
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
