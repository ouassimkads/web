import { createTheme } from '@mui/material/styles';

// IBM Carbon tokens (White theme)
export const carbon = {
  blue60: '#0f62fe',
  blue60Hover: '#0353e9',
  blue80Active: '#002d9c',
  gray10: '#f4f4f4',
  gray20: '#e0e0e0',
  gray20Hover: '#e8e8e8',
  gray30: '#c6c6c6',
  gray50: '#8d8d8d',
  gray70: '#525252',
  gray80: '#393939',
  gray100: '#161616',
  red60: '#da1e28',
  red10: '#fff1f1',
  green60: '#198038',
  green10: '#defbe6',
  blue10: '#edf5ff',
  white: '#ffffff',
  font: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
};

const carbonTheme = createTheme({
  palette: {
    primary: {
      main: carbon.blue60,
      dark: carbon.blue60Hover,
      contrastText: carbon.white,
    },
    error: { main: carbon.red60 },
    success: { main: carbon.green60 },
    text: {
      primary: carbon.gray100,
      secondary: carbon.gray70,
      disabled: carbon.gray50,
    },
    divider: carbon.gray20,
    background: { default: carbon.white, paper: carbon.white },
  },

  // Carbon uses square corners everywhere
  shape: { borderRadius: 0 },

  typography: {
    fontFamily: carbon.font,
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '0.16px',
    },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 40,
          paddingLeft: 16,
          paddingRight: 16,
          fontSize: 14,
          '&.Mui-focusVisible': {
            outline: `2px solid ${carbon.blue60}`,
            outlineOffset: -4,
          },
        },
        sizeSmall: { height: 32 },
        // Carbon "ghost" button (also covers textPrimary)
        text: {
          '&:hover': { backgroundColor: carbon.gray20Hover },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            '&:hover': { backgroundColor: carbon.blue60Hover },
            '&:active': { backgroundColor: carbon.blue80Active },
            '&.Mui-disabled': {
              backgroundColor: carbon.gray30,
              color: carbon.gray50,
            },
          },
        },
        {
          props: { variant: 'contained', color: 'error' },
          style: {
            '&:hover': { backgroundColor: '#b81921' },
          },
        },
        // Carbon "tertiary" button
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            border: `1px solid ${carbon.blue60}`,
            '&:hover': {
              backgroundColor: carbon.blue60,
              color: carbon.white,
              border: `1px solid ${carbon.blue60}`,
            },
          },
        },
      ],
    },

    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          '&:hover': { backgroundColor: carbon.gray20Hover },
          '&.Mui-focusVisible': {
            outline: `2px solid ${carbon.blue60}`,
            outlineOffset: -2,
          },
        },
      },
    },

    // Carbon text input: gray fill, bottom border, 2px blue focus outline
    MuiTextField: { defaultProps: { variant: 'filled' } },

    MuiFilledInput: {
      defaultProps: { disableUnderline: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: carbon.gray10,
          fontSize: 14,
          borderBottom: `1px solid ${carbon.gray50}`,
          transition: 'none',
          '&:hover': { backgroundColor: carbon.gray20Hover },
          '&.Mui-focused': {
            backgroundColor: carbon.gray10,
            outline: `2px solid ${carbon.blue60}`,
            outlineOffset: -2,
            borderBottomColor: 'transparent',
          },
          '&.Mui-error': {
            outline: `2px solid ${carbon.red60}`,
            outlineOffset: -2,
          },
          '&.Mui-disabled': {
            backgroundColor: carbon.gray10,
            color: carbon.gray50,
            borderBottomColor: 'transparent',
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          color: carbon.gray70,
          '&.Mui-focused': { color: carbon.gray70 },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
          minHeight: 40,
          '&:hover': { backgroundColor: carbon.gray20Hover },
          '&.Mui-selected': { backgroundColor: carbon.gray20 },
          '&.Mui-selected:hover': { backgroundColor: carbon.gray20Hover },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: carbon.gray20Hover },
          '&.Mui-selected': {
            backgroundColor: carbon.gray20,
            boxShadow: `inset 3px 0 0 ${carbon.blue60}`,
          },
          '&.Mui-selected:hover': { backgroundColor: carbon.gray20Hover },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: 20, fontWeight: 400, lineHeight: '28px' },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 14,
          letterSpacing: '0.16px',
          borderBottom: `1px solid ${carbon.gray20}`,
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: carbon.gray20Hover,
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 0,
          backgroundColor: carbon.gray80,
          fontSize: 12,
        },
        arrow: { color: carbon.gray80 },
      },
    },

    // Carbon inline notifications
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 0, fontSize: 14 },
      },
      variants: [
        {
          props: { variant: 'standard', severity: 'error' },
          style: {
            backgroundColor: carbon.red10,
            color: carbon.gray100,
            borderLeft: `3px solid ${carbon.red60}`,
          },
        },
        {
          props: { variant: 'standard', severity: 'success' },
          style: {
            backgroundColor: carbon.green10,
            color: carbon.gray100,
            borderLeft: `3px solid ${carbon.green60}`,
          },
        },
        {
          props: { variant: 'standard', severity: 'info' },
          style: {
            backgroundColor: carbon.blue10,
            color: carbon.gray100,
            borderLeft: `3px solid ${carbon.blue60}`,
          },
        },
        // Carbon toast notification: dark, colored left edge
        {
          props: { variant: 'filled', severity: 'error' },
          style: {
            backgroundColor: carbon.gray80,
            color: carbon.white,
            borderLeft: `3px solid #ff8389`,
          },
        },
        {
          props: { variant: 'filled', severity: 'success' },
          style: {
            backgroundColor: carbon.gray80,
            color: carbon.white,
            borderLeft: `3px solid #42be65`,
          },
        },
      ],
    },
  },
});

export default carbonTheme;
