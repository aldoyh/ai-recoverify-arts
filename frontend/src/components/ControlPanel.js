import React from 'react';
import './ControlPanel.css';

function ControlPanel({ settings, setSettings, onRestore, onReset, isProcessing }) {
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="control-panel">
      <h3>Restoration Settings</h3>

      <div className="control-group">
        <label>Enhancement Level</label>
        <select
          value={settings.enhancement_level}
          onChange={(e) => updateSetting('enhancement_level', e.target.value)}
          disabled={isProcessing}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="control-group">
        <label>Denoise Strength</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.denoise_strength}
          onChange={(e) => updateSetting('denoise_strength', parseFloat(e.target.value))}
          disabled={isProcessing}
        />
        <span className="value-display">{settings.denoise_strength.toFixed(1)}</span>
      </div>

      <div className="control-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={settings.sharpen}
            onChange={(e) => updateSetting('sharpen', e.target.checked)}
            disabled={isProcessing}
          />
          <span>Apply Sharpening</span>
        </label>
      </div>

      <div className="control-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={settings.color_correction}
            onChange={(e) => updateSetting('color_correction', e.target.checked)}
            disabled={isProcessing}
          />
          <span>Color Correction</span>
        </label>
      </div>

      <div className="control-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={settings.damage_repair}
            onChange={(e) => updateSetting('damage_repair', e.target.checked)}
            disabled={isProcessing}
          />
          <span>Damage Repair</span>
        </label>
      </div>

      <div className="button-group">
        <button
          onClick={onRestore}
          disabled={isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? 'Processing...' : 'Restore Artwork'}
        </button>

        <button
          onClick={onReset}
          disabled={isProcessing}
          className="btn btn-secondary"
        >
          Upload New Image
        </button>
      </div>

      <div className="info-section">
        <h4>Tips for Best Results</h4>
        <ul>
          <li>Use high-resolution images when possible</li>
          <li>Higher enhancement levels may take longer to process</li>
          <li>Damage repair works best on scratches and tears</li>
          <li>Color correction helps with faded images</li>
        </ul>
      </div>
    </div>
  );
}

export default ControlPanel;
