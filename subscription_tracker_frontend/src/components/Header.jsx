import { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ onAddClick }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">💳</span>
          <h1>SubTracker</h1>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className="btn-theme" 
          onClick={() => setIsDark(!isDark)}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        
        <button className="btn-add" onClick={onAddClick}>
          <span className="btn-add-icon">+</span>
          <span className="btn-add-text">Add Subscription</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
