// src/App.js
import React from 'react';
import WeatherApp from './components/WeatherApp';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <WeatherApp />
    </ThemeProvider>
  );
}

export default App;