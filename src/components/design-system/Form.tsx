// Design System Form Components
// Unified form components with consistent styling and accessibility

"use client";

import React, { forwardRef } from "react";
import { InputProps, SelectProps, FormGroupProps } from "./types";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      helpText,
      label,
      leftIcon,
      rightIcon,
      className = "",
      testId,
      ...props
    },
    ref
  ) => {
    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = [
      "form-input",
      `form-input-${variant}`,
      size !== "md" && `form-input-${size}`,
      error && "form-input-error",
      leftIcon && "form-input-with-left-icon",
      rightIcon && "form-input-with-right-icon",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const input = (
      <div className="form-input-wrapper">
        {leftIcon && (
          <div className="form-input-icon form-input-icon-left">{leftIcon}</div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helpText
              ? `${inputId}-help`
              : undefined
          }
          data-testid={testId}
          {...props}
        />
        {rightIcon && (
          <div className="form-input-icon form-input-icon-right">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || error || helpText) {
      return (
        <FormGroup
          label={label}
          error={error}
          helpText={helpText}
          htmlFor={inputId}
        >
          {input}
        </FormGroup>
      );
    }

    return input;
  }
);

Input.displayName = "Input";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  Omit<InputProps, "leftIcon" | "rightIcon" | "onChange"> & {
    rows?: number;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>
>(
  (
    {
      variant = "default",
      size = "md",
      error,
      helpText,
      label,
      rows = 4,
      className = "",
      testId,
      ...props
    },
    ref
  ) => {
    const inputId =
      props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const textareaClasses = [
      "form-input",
      "form-textarea",
      `form-input-${variant}`,
      size !== "md" && `form-input-${size}`,
      error && "form-input-error",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const textarea = (
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={textareaClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
        }
        data-testid={testId}
        {...props}
      />
    );

    if (label || error || helpText) {
      return (
        <FormGroup
          label={label}
          error={error}
          helpText={helpText}
          htmlFor={inputId}
        >
          {textarea}
        </FormGroup>
      );
    }

    return textarea;
  }
);

TextArea.displayName = "TextArea";

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  error,
  label,
  size = "md",
  className = "",
  testId,
  children,
}) => {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = [
    "form-select",
    `form-select-${size}`,
    error && "form-select-error",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  const select = (
    <div className="form-select-wrapper">
      <select
        id={selectId}
        value={value || ""}
        onChange={handleChange}
        className={selectClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${selectId}-error` : undefined}
        data-testid={testId}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
        {children}
      </select>
      <div className="form-select-arrow">
        <ChevronDownIcon />
      </div>
    </div>
  );

  if (label || error) {
    return (
      <FormGroup label={label} error={error} htmlFor={selectId}>
        {select}
      </FormGroup>
    );
  }

  return select;
};

export const Label: React.FC<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ htmlFor, required, children, className = "" }) => (
  <label htmlFor={htmlFor} className={`form-label ${className}`}>
    {children}
    {required && <span className="form-label-required">*</span>}
  </label>
);

export const FormGroup: React.FC<FormGroupProps & { htmlFor?: string }> = ({
  label,
  error,
  helpText,
  required,
  htmlFor,
  children,
  className = "",
  testId,
}) => {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const helpId = helpText ? `${htmlFor}-help` : undefined;

  return (
    <div className={`form-group ${className}`} data-testid={testId}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div id={helpId} className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
};

// Internal ChevronDown icon component
const ChevronDownIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);
