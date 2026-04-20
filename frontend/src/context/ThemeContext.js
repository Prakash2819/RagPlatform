import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme} style={{
        '--bg-primary':     theme === 'dark' ? '#0f1117' : '#ffffff',
        '--bg-secondary':   theme === 'dark' ? '#1a1d27' : '#f8fafc',
        '--text-primary':   theme === 'dark' ? '#f0f2f8' : '#0f172a',
        '--text-secondary': theme === 'dark' ? '#9ca3af' : '#64748b',
        '--border-primary': theme === 'dark' ? '#2a2d3a' : '#e5e7eb',
        '--surface-hover':  theme === 'dark' ? '#1f2230' : '#f1f5f9',
        minHeight: '100vh',
        background: theme === 'dark' ? '#0f1117' : '#f8fafc',
        color:      theme === 'dark' ? '#f0f2f8' : '#0f172a',
        transition: 'all 0.2s',
        fontFamily: "'DM Sans', Arial, sans-serif",
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}