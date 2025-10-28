import React, { useCallback, useState } from 'react';
import './FileUpload.css';

function FileUpload({ onFileSelect, onRestore, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleRestore = () => {
    if (selectedFile) {
      onRestore(selectedFile);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <div className="dropzone-content">
          <svg className="upload-icon" viewBox="0 0 24 24">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>

          <h2>Upload Your Artwork</h2>
          <p>Drag and drop your image here, or click to browse</p>

          <label htmlFor="fileInput" className="upload-button">
            Choose File
          </label>

          <p className="file-info">Supports: JPG, PNG, BMP, TIFF, WEBP</p>
        </div>
      </div>

      {selectedFile && !isProcessing && (
        <div className="file-selected">
          <p>Selected: {selectedFile.name}</p>
          <button onClick={handleRestore} className="restore-button">
            Start Restoration
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <p>Processing your artwork...</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
