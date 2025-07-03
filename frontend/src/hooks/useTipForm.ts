/**
 * useTipForm.ts
 * 
 * A specialized hook for managing tip form state and validation,
 * providing a clean interface for components that need to collect
 * tipping information from users.
 */

import { useState, useCallback } from 'react';
import useTipping from './useTipping';

export interface TipFormValues {
  recipientAddress: string;
  amount: number;
  eventId: string;
  speakerId: string;
  message: string;
}

export interface TipFormErrors {
  recipientAddress?: string;
  amount?: string;
  eventId?: string;
  speakerId?: string;
  message?: string;
  form?: string;
}

interface UseTipFormOptions {
  initialValues?: Partial<TipFormValues>;
  onSubmitSuccess?: (tipId: string) => void;
  onSubmitError?: (error: string) => void;
}

export const useTipForm = (options: UseTipFormOptions = {}) => {
  // Initialize with default or provided values
  const [values, setValues] = useState<TipFormValues>({
    recipientAddress: options.initialValues?.recipientAddress || '',
    amount: options.initialValues?.amount || 0,
    eventId: options.initialValues?.eventId || '',
    speakerId: options.initialValues?.speakerId || '',
    message: options.initialValues?.message || ''
  });

  // State for form errors
  const [errors, setErrors] = useState<TipFormErrors>({});
  const [touched, setTouched] = useState<Record<keyof TipFormValues, boolean>>({
    recipientAddress: false,
    amount: false,
    eventId: false,
    speakerId: false,
    message: false
  });

  // Get tipping functionality from the main hook
  const { sendTip, isProcessing } = useTipping();

  /**
   * Validate all form fields and return validation result
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: TipFormErrors = {};
    let isValid = true;

    // Validate recipient address
    if (!values.recipientAddress) {
      newErrors.recipientAddress = 'Recipient address is required';
      isValid = false;
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(values.recipientAddress)) {
      newErrors.recipientAddress = 'Invalid Ethereum address';
      isValid = false;
    }

    // Validate amount
    if (!values.amount || values.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
      isValid = false;
    } else if (values.amount > 1000) { // Example maximum
      newErrors.amount = 'Amount cannot exceed 1000 USDC';
      isValid = false;
    }

    // Validate event ID
    if (!values.eventId) {
      newErrors.eventId = 'Event ID is required';
      isValid = false;
    }

    // Validate speaker ID
    if (!values.speakerId) {
      newErrors.speakerId = 'Speaker ID is required';
      isValid = false;
    }

    // Message is optional, but if provided, validate length
    if (values.message && values.message.length > 500) {
      newErrors.message = 'Message cannot exceed 500 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [values]);

  /**
   * Handle field change
   */
  const handleChange = useCallback((field: keyof TipFormValues, value: string | number) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark field as touched
    if (!touched[field]) {
      setTouched(prev => ({
        ...prev,
        [field]: true
      }));
    }
  }, [touched]);

  /**
   * Handle field blur for validation
   */
  const handleBlur = useCallback((field: keyof TipFormValues) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate the specific field
    const newErrors = { ...errors };
    
    switch (field) {
      case 'recipientAddress':
        if (!values.recipientAddress) {
          newErrors.recipientAddress = 'Recipient address is required';
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(values.recipientAddress)) {
          newErrors.recipientAddress = 'Invalid Ethereum address';
        } else {
          delete newErrors.recipientAddress;
        }
        break;
        
      case 'amount':
        if (!values.amount || values.amount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        } else if (values.amount > 1000) {
          newErrors.amount = 'Amount cannot exceed 1000 USDC';
        } else {
          delete newErrors.amount;
        }
        break;
        
      case 'eventId':
        if (!values.eventId) {
          newErrors.eventId = 'Event ID is required';
        } else {
          delete newErrors.eventId;
        }
        break;
      
      case 'speakerId':
        if (!values.speakerId) {
          newErrors.speakerId = 'Speaker ID is required';
        } else {
          delete newErrors.speakerId;
        }
        break;
        
      case 'message':
        if (values.message && values.message.length > 500) {
          newErrors.message = 'Message cannot exceed 500 characters';
        } else {
          delete newErrors.message;
        }
        break;
    }

    setErrors(newErrors);
  }, [values, errors]);

  /**
   * Reset form to initial state or new values
   */
  const resetForm = useCallback((newValues?: Partial<TipFormValues>) => {
    setValues({
      recipientAddress: newValues?.recipientAddress || options.initialValues?.recipientAddress || '',
      amount: newValues?.amount || options.initialValues?.amount || 0,
      eventId: newValues?.eventId || options.initialValues?.eventId || '',
      speakerId: newValues?.speakerId || options.initialValues?.speakerId || '',
      message: newValues?.message || options.initialValues?.message || ''
    });
    setErrors({});
    setTouched({
      recipientAddress: false,
      amount: false,
      eventId: false,
      speakerId: false,
      message: false
    });
  }, [options.initialValues]);

  /**
   * Submit the form
   */
  const submitForm = useCallback(async () => {
    // Set all fields as touched
    setTouched({
      recipientAddress: true,
      amount: true,
      eventId: true,
      speakerId: true,
      message: true
    });
    
    // Validate form
    if (!validateForm()) {
      return {
        success: false,
        error: 'Please fix the form errors before submitting'
      };
    }

    try {
      // Send the tip
      const result = await sendTip({
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        eventId: values.eventId,
        speakerId: values.speakerId,
        message: values.message
      });

      if (result.success) {
        // Call the success callback
        if (options.onSubmitSuccess && result.data) {
          options.onSubmitSuccess(result.data);
        }
        
        // Reset the form
        resetForm();
      } else {
        // Set form error
        setErrors(prev => ({
          ...prev,
          form: result.error || 'Failed to send tip'
        }));
        
        // Call the error callback
        if (options.onSubmitError && result.error) {
          options.onSubmitError(result.error);
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Set form error
      setErrors(prev => ({
        ...prev,
        form: errorMessage
      }));
      
      // Call the error callback
      if (options.onSubmitError) {
        options.onSubmitError(errorMessage);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [values, validateForm, sendTip, options.onSubmitSuccess, options.onSubmitError, resetForm]);

  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting: isProcessing,
    
    // Form actions
    handleChange,
    handleBlur,
    submitForm,
    resetForm,
    validateForm,
    
    // Field helpers
    setFieldValue: handleChange,
    setFieldTouched: handleBlur,
    getFieldProps: (field: keyof TipFormValues) => ({
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleChange(field, field === 'amount' ? parseFloat(e.target.value) : e.target.value),
      onBlur: () => handleBlur(field),
      error: touched[field] ? errors[field] : undefined
    })
  };
};

export default useTipForm;