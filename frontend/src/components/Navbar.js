import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import * as React from "react";
const Navbar = () => {
 
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="relative">
        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{ cursor: "pointer" }}
          >
            Access-Control-in-User-Hierarchy-Based-on-Elliptic-Curve-Cryptosystem
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
