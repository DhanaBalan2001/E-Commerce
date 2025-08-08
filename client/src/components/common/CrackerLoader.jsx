import React from 'react';
import './CrackerLoader.css';

const CrackerLoader = ({ size = 'md', text = 'Loading...' }) => {
  return (
    <div className="cracker-loader-container">
      <p className={`cracker-loader-text cracker-loader-${size}`}>{text}</p>
    </div>
  );
};

export default CrackerLoader;