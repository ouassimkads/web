import { useState } from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Outlet } from 'react-router';

import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <AppBar position="static" elevation={0} color="transparent">
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setOpen((prev) => !prev)}
              sx={{ mr: 2 }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              CRMA Administrateur
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}