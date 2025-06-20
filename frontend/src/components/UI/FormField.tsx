import React, { useState, useId } from 'react';
import './FormField.css';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'number' | 'email' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string }>;
  rows?: number;
  helpText?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  min,
  max,
  step,
  options = [],
  rows = 3,
  helpText,
  prefix,
  suffix,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const fieldId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
    if (!isTouched) setIsTouched(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsTouched(true);
  };

  const showError = error && isTouched;
  const fieldClassName = `
    form-field 
    ${className}
    ${isFocused ? 'focused' : ''}
    ${showError ? 'error' : ''}
    ${disabled ? 'disabled' : ''}
    ${value ? 'has-value' : ''}
  `.trim();

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      value,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      disabled,
      required,
      'aria-invalid': showError ? 'true' : 'false',
      'aria-describedby': showError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined,
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            className="form-input form-textarea"
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            className="form-input form-select"
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
            className="form-input"
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            className="form-input"
          />
        );
    }
  };

  return (
    <div className={fieldClassName}>
      <label htmlFor={fieldId} className="form-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>

      <div className="form-input-wrapper">
        {prefix && <span className="input-prefix">{prefix}</span>}
        {renderInput()}
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>

      {showError && (
        <div id={`${fieldId}-error`} className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {helpText && !showError && (
        <div id={`${fieldId}-help`} className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
};