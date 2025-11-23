import React, { useState } from 'react';
import './ImageComparison.css';

function ImageComparison({ originalImage, restoredImage, isProcessing, progress, onDownload }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  return (
    <div className="image-comparison">
      <div className="comparison-header">
        <h3>Image Preview</h3>
        {restoredImage && (
          <button onClick={onDownload} className="download-btn">
            Download Restored Image
          </button>
        )}
      </div>

      <div className="comparison-container">
        {isProcessing ? (
          <div className="processing-overlay">
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{progress}% Complete</p>
              <div className="processing-animation">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
              </div>
            </div>
          </div>
        ) : restoredImage ? (
          <div className="slider-comparison">
            <div className="image-wrapper">
              <img src={restoredImage} alt="Restored" className="restored-image" />
              <div
                className="original-overlay"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img src={originalImage} alt="Original" className="original-image" />
              </div>
              <div
                className="slider-handle"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="handle-circle">
                  <svg viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="comparison-slider"
            />
            <div className="comparison-labels">
              <span className="label-original">Original</span>
              <span className="label-restored">Restored</span>
            </div>
          </div>
        ) : (
          <div className="preview-placeholder">
            <img src={originalImage} alt="Original" className="single-image" />
            <p className="placeholder-text">Adjust settings and click "Restore Artwork" to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageComparison;
