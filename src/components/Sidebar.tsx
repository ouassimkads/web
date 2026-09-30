import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { styled } from '@mui/material/styles';
import { Link, useLocation, useNavigate } from 'react-router';

const drawerWidth = 256; // Carbon side nav width
const API_URL = import.meta.env.VITE_API_URL;

// IBM Carbon tokens
const carbon = {
  blue60: '#0f62fe',
  gray10: '#f4f4f4',
  gray20: '#e0e0e0',
  gray20Hover: '#e8e8e8',
  gray70: '#525252',
  gray100: '#161616',
  white: '#ffffff',
  font: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
};

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(0, 2),
  minHeight: 64,
}));

const SectionLabel = styled(Typography)({
  fontFamily: carbon.font,
  fontSize: 12,
  letterSpacing: '0.32px',
  color: carbon.gray70,
  padding: '0 16px 8px',
});

const navigation = [
  {
    label: 'Statistiques',
    href: '/dashboard/overview',
    icon: <DashboardRoundedIcon sx={{ fontSize: 16 }} />,
  },
  {
    label: 'Dossier',
    href: '/dashboard/folders',
    icon: <FolderRoundedIcon sx={{ fontSize: 16 }} />,
  },
  {
    label: 'Archive',
    href: '/dashboard/archive',
    icon: <Inventory2RoundedIcon sx={{ fontSize: 16 }} />,
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// Shared Carbon side-nav item look (square, 40px, blue focus outline)
const itemSx = {
  height: 40,
  px: 2,
  borderRadius: 0,
  color: carbon.gray70,
  fontFamily: carbon.font,
  borderLeft: '3px solid transparent',
  pl: 'calc(16px - 3px)',
  transition: 'none',
  '&:hover': { bgcolor: carbon.gray20Hover, color: carbon.gray100 },
  '&.Mui-focusVisible': {
    outline: `2px solid ${carbon.blue60}`,
    outlineOffset: '-2px',
  },
};

export default function Sidebar({ open }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la déconnexion.');
      }
    } catch (error) {
      console.error('[LOGOUT]', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const renderItem = (item: (typeof navigation)[number]) => {
    const active =
      item.href === '/dashboard'
        ? pathname === item.href
        : pathname.startsWith(item.href);

    return (
      <ListItemButton
        key={item.href}
        component={Link}
        to={item.href}
        selected={active}
        sx={{
          ...itemSx,
          // Carbon active state: 3px blue bar on the left, darker text
          ...(active && {
            color: carbon.gray100,
            borderLeftColor: carbon.blue60,
            bgcolor: carbon.gray20,
          }),
          '&.Mui-selected': {
            bgcolor: carbon.gray20,
            color: carbon.gray100,
          },
          '&.Mui-selected:hover': { bgcolor: carbon.gray20Hover },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
          {item.icon}
        </ListItemIcon>

        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                fontFamily: carbon.font,
                fontSize: 14,
                letterSpacing: '0.16px',
                fontWeight: active ? 600 : 400,
              },
            },
          }}
        />
      </ListItemButton>
    );
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          borderRight: `1px solid ${carbon.gray20}`,
          bgcolor: carbon.white,
        },
      }}
    >
      <DrawerHeader>
        <img src="/images.png" alt="logo" width={32} />

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontFamily: carbon.font,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.29,
              color: carbon.gray100,
            }}
          >
            CRMA
          </Typography>

          <Typography
            noWrap
            sx={{
              fontFamily: carbon.font,
              fontSize: 12,
              letterSpacing: '0.32px',
              color: carbon.gray70,
              lineHeight: 1.33,
            }}
          >
            Panneau d’administration
          </Typography>
        </Box>
      </DrawerHeader>

      <Divider sx={{ borderColor: carbon.gray20 }} />

      <List sx={{ py: 2, px: 0 }}>
        <SectionLabel>Workspace</SectionLabel>

        {navigation.map(renderItem)}
      </List>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ borderColor: carbon.gray20 }} />

        <List sx={{ py: 1, px: 0 }}>
          <ListItemButton onClick={handleLogout} sx={itemSx}>
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <LogoutRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>

            <ListItemText
              primary="Se déconnecter"
              slotProps={{
                primary: {
                  sx: {
                    fontFamily: carbon.font,
                    fontSize: 14,
                    letterSpacing: '0.16px',
                    fontWeight: 400,
                  },
                },
              }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
