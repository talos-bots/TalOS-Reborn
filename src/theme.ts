import { ThemeOptions, createTheme } from '@mui/material/styles';

export const currentTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#41b2bf',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#303030',
      paper: '#424242',
    },
    text: {
      primary: '#fff',
      secondary: '#fff',
    },
    warning: {
      main: '#ff9800',
    },
  },
};

export const theme = createTheme(currentTheme);