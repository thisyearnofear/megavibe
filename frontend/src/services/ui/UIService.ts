/**
 * UIService.ts
 * 
 * Service for managing UI-related operations and state,
 * providing a centralized way to handle modals, notifications,
 * loading states, and other UI concerns.
 */

import { BaseService, ServiceResponse } from '../core/BaseService';
import StateService from '../core/StateService';
import ValidationService from '../core/ValidationService';
import { Notification } from '../core/StateService';
import { v4 as uuidv4 } from 'uuid';

export interface ModalOptions {
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  className?: string;
  showCloseButton?: boolean;
}

export interface NotificationOptions {
  duration?: number;
  autoDismiss?: boolean;
}

class UIServiceClass extends BaseService {
  constructor() {
    super('UIService');
  }

  /**
   * Show a modal
   */
  public showModal(modalId: string, data?: any): void {
    // Dispatch action to show modal
    StateService.dispatch({
      type: 'ui/showModal',
      payload: modalId
    });
    
    // If data is provided, store it for the modal
    if (data) {
      StateService.dispatch({
        type: 'ui/setModalData',
        payload: {
          modalId,
          data
        }
      });
    }
    
    this.logInfo(`Modal shown: ${modalId}`);
  }
  
  /**
   * Hide a modal
   */
  public hideModal(modalId: string): void {
    // Dispatch action to hide modal
    StateService.dispatch({
      type: 'ui/hideModal',
      payload: modalId
    });
    
    // Clear modal data
    StateService.dispatch({
      type: 'ui/clearModalData',
      payload: modalId
    });
    
    this.logInfo(`Modal hidden: ${modalId}`);
  }
  
  /**
   * Show a notification
   */
  public showNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    message: string,
    details?: string,
    options: NotificationOptions = {}
  ): string {
    // Create notification
    const notification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
      type,
      message,
      details,
      autoDismiss: options.autoDismiss !== undefined ? options.autoDismiss : true,
      duration: options.duration || 5000
    };
    
    // Dispatch action to add notification
    StateService.dispatch({
      type: 'ui/addNotification',
      payload: notification
    });
    
    // Return the notification ID (since we don't create it directly,
    // this would need to be updated with the actual implementation)
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logInfo(`Notification shown: ${type} - ${message}`);
    
    return notificationId;
  }
  
  /**
   * Remove a notification
   */
  public removeNotification(notificationId: string): void {
    // Dispatch action to remove notification
    StateService.dispatch({
      type: 'ui/removeNotification',
      payload: notificationId
    });
    
    this.logInfo(`Notification removed: ${notificationId}`);
  }
  
  /**
   * Mark a notification as read
   */
  public markNotificationAsRead(notificationId: string): void {
    // Dispatch action to mark notification as read
    StateService.dispatch({
      type: 'ui/markNotificationAsRead',
      payload: notificationId
    });
  }
  
  /**
   * Clear all notifications
   */
  public clearNotifications(): void {
    // Dispatch action to clear notifications
    StateService.dispatch({
      type: 'ui/clearNotifications'
    });
    
    this.logInfo('All notifications cleared');
  }
  
  /**
   * Set loading state
   */
  public setLoading(key: string, isLoading: boolean): void {
    // Dispatch action to set loading state
    StateService.dispatch({
      type: 'ui/setLoading',
      payload: {
        key,
        isLoading
      }
    });
  }
  
  /**
   * Set error state
   */
  public setError(key: string, error: string | null): void {
    // Dispatch action to set error state
    StateService.dispatch({
      type: 'ui/setError',
      payload: {
        key,
        error
      }
    });
  }
  
  /**
   * Show a success notification
   */
  public showSuccess(message: string, details?: string, options?: NotificationOptions): string {
    return this.showNotification('success', message, details, options);
  }
  
  /**
   * Show an error notification
   */
  public showError(message: string, details?: string, options?: NotificationOptions): string {
    return this.showNotification('error', message, details, {
      autoDismiss: false,
      ...options
    });
  }
  
  /**
   * Show a warning notification
   */
  public showWarning(message: string, details?: string, options?: NotificationOptions): string {
    return this.showNotification('warning', message, details, options);
  }
  
  /**
   * Show an info notification
   */
  public showInfo(message: string, details?: string, options?: NotificationOptions): string {
    return this.showNotification('info', message, details, options);
  }
  
  /**
   * Set active tab
   */
  public setActiveTab(tabId: string): void {
    // Dispatch action to set active tab
    StateService.dispatch({
      type: 'ui/setActiveTab',
      payload: tabId
    });
    
    this.logInfo(`Active tab set: ${tabId}`);
  }
  
  /**
   * Get all modals
   */
  public getModals(): Record<string, boolean> {
    // Get modals from state
    const state = StateService.getState() as any;
    return state.ui?.modals || {};
  }
  
  /**
   * Check if a modal is open
   */
  public isModalOpen(modalId: string): boolean {
    // Get modals from state
    const modals = this.getModals();
    return !!modals[modalId];
  }
  
  /**
   * Get modal data
   */
  public getModalData(modalId: string): any {
    // Get modal data from state
    const state = StateService.getState() as any;
    return state.ui?.modalData?.[modalId];
  }
  
  /**
   * Get loading state
   */
  public isLoading(key: string): boolean {
    // Get loading state from state
    const state = StateService.getState() as any;
    return !!state.ui?.loading?.[key];
  }
  
  /**
   * Get error state
   */
  public getError(key: string): string | null {
    // Get error state from state
    const state = StateService.getState() as any;
    return state.ui?.errors?.[key] || null;
  }
  
  /**
   * Get notifications
   */
  public getNotifications(): Notification[] {
    // Get notifications from state
    const state = StateService.getState() as any;
    return state.ui?.notifications || [];
  }
  
  /**
   * Get active tab
   */
  public getActiveTab(): string {
    // Get active tab from state
    const state = StateService.getState() as any;
    return state.ui?.activeTab || '';
  }
  
  /**
   * Validate a form and show errors as notifications
   */
  public validateForm<T extends Record<string, any>>(
    data: T,
    schema: any,
    showNotifications: boolean = false
  ): {
    isValid: boolean;
    errors: Record<string, string[]>;
  } {
    // Validate data using ValidationService
    const result = ValidationService.validate(data, schema);
    
    // Show notifications for errors if requested
    if (showNotifications && !result.isValid) {
      // Create a message from all errors
      const errorMessages = Object.entries(result.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n');
      
      this.showError('Form validation failed', errorMessages);
    }
    
    return {
      isValid: result.isValid,
      errors: result.errors
    };
  }
}

// Export singleton instance
const UIService = new UIServiceClass();
export default UIService;