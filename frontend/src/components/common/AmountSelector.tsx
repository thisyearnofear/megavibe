import React, { useState } from 'react';
import './AmountSelector.css';

interface AmountSelectorProps {
  presets: number[];
  selected: number;
  onSelect: (amount: number) => void;
  currency?: string;
  showCustomInput?: boolean;
  customPlaceholder?: string;
  min?: number;
  max?: number;
  className?: string;
}

export const AmountSelector: React.FC<AmountSelectorProps> = ({
  presets,
  selected,
  onSelect,
  currency = '$',
  showCustomInput = true,
  customPlaceholder = 'Custom amount',
  min = 1,
  max = 1000,
  className = ''
}) => {
  const [customValue, setCustomValue] = useState<string>('');
  const [isCustomActive, setIsCustomActive] = useState(false);

  const handlePresetSelect = (amount: number) => {
    setIsCustomActive(false);
    setCustomValue('');
    onSelect(amount);
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setIsCustomActive(true);
      onSelect(numValue);
    }
  };

  const isPresetSelected = (amount: number) => {
    return !isCustomActive && selected === amount;
  };

  return (
    <div className={`amount-selector ${className}`}>
      <div className="preset-amounts">
        {presets.map(amount => (
          <button
            key={amount}
            type="button"
            className={`amount-btn ${isPresetSelected(amount) ? 'selected' : ''}`}
            onClick={() => handlePresetSelect(amount)}
          >
            {currency}{amount}
          </button>
        ))}
      </div>

      {showCustomInput && (
        <div className="custom-amount-section">
          <label className="custom-amount-label">
            {customPlaceholder}
          </label>
          <div className="custom-amount-input-wrapper">
            <span className="currency-symbol">{currency}</span>
            <input
              type="number"
              className={`custom-amount-input ${isCustomActive ? 'active' : ''}`}
              placeholder="0.00"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              min={min}
              max={max}
              step="0.01"
            />
          </div>
          {customValue && (
            <div className="custom-amount-validation">
              {parseFloat(customValue) < min && (
                <span className="validation-error">
                  Minimum amount is {currency}{min}
                </span>
              )}
              {parseFloat(customValue) > max && (
                <span className="validation-error">
                  Maximum amount is {currency}{max}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmountSelector;
