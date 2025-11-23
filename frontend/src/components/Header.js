import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <svg viewBox="0 0 24 24" className="logo-icon">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"/>
          </svg>
          <h1>AI Recoverify Arts</h1>
        </div>
        <p className="tagline">Restore Your Precious Artwork with AI</p>
      </div>
    </header>
  );
}

export default Header;
