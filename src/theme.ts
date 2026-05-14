import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f7d6d',
      dark: '#235e52',
      light: '#4d9b8b',
    },
    secondary: {
      main: '#d9827c',
    },
    background: {
      default: '#f6f1ea',
      paper: '#ffffff',
    },
    text: {
      primary: '#2f2724',
      secondary: '#6f625f',
    },
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 10px 30px rgba(47, 39, 36, 0.08)',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
          border: '1px solid rgba(47, 39, 36, 0.08)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})

export default theme
