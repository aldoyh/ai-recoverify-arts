import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ImageComparison from './components/ImageComparison';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [restoredImage, setRestoredImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [settings, setSettings] = useState({
    enhancement_level: 'medium',
    denoise_strength: 0.5,
    sharpen: true,
    color_correction: true,
    damage_repair: true
  });

  const handleFileSelect = (file) => {
    setOriginalImage(URL.createObjectURL(file));
    setRestoredImage(null);
    setError(null);
  };

  const handleRestore = async (file) => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enhancement_level', settings.enhancement_level);
      formData.append('denoise_strength', settings.denoise_strength);
      formData.append('sharpen', settings.sharpen);
      formData.append('color_correction', settings.color_correction);
      formData.append('damage_repair', settings.damage_repair);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await axios.post(`${API_URL}/api/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (response.data.success) {
        const restoredUrl = `${API_URL}${response.data.download_url}`;
        setRestoredImage(restoredUrl);
      } else {
        throw new Error(response.data.error || 'Restoration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during restoration');
      console.error('Restoration error:', err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const handleDownload = () => {
    if (restoredImage) {
      const link = document.createElement('a');
      link.href = restoredImage;
      link.download = 'restored-artwork.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="App">
      <Header />

      <main className="main-content">
        <div className="container">
          {!originalImage ? (
            <div className="upload-section">
              <FileUpload
                onFileSelect={handleFileSelect}
                onRestore={handleRestore}
                isProcessing={isProcessing}
              />
            </div>
          ) : (
            <div className="workspace">
              <ControlPanel
                settings={settings}
                setSettings={setSettings}
                onRestore={() => {
                  // Get the file from the upload component
                  const fileInput = document.querySelector('input[type="file"]');
                  if (fileInput && fileInput.files[0]) {
                    handleRestore(fileInput.files[0]);
                  }
                }}
                onReset={() => {
                  setOriginalImage(null);
                  setRestoredImage(null);
                  setError(null);
                }}
                isProcessing={isProcessing}
              />

              <ImageComparison
                originalImage={originalImage}
                restoredImage={restoredImage}
                isProcessing={isProcessing}
                progress={processingProgress}
                onDownload={handleDownload}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>AI Recoverify Arts - Powered by Advanced AI Restoration Technology</p>
      </footer>
    </div>
  );
}

export default App;
