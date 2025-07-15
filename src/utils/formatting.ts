/**
 * Formats an Ethereum address by shortening it for display
 * @param address The full Ethereum address
 * @returns Shortened address (e.g., 0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats an ETH amount with appropriate decimal places
 * @param amount The amount in wei or as a string
 * @param decimals Number of decimal places to show (default: 4)
 * @returns Formatted ETH amount as string
 */
export function formatEthAmount(amount: string | number, decimals: number = 4): string {
  if (!amount) return '0';
  
  let value: number;
  
  if (typeof amount === 'string') {
    // Handle string representation of amount
    try {
      // Remove any non-numeric characters except decimal point
      const cleanedAmount = amount.replace(/[^\d.-]/g, '');
      value = parseFloat(cleanedAmount);
    } catch (error) {
      console.error('Error parsing ETH amount:', error);
      return '0';
    }
  } else {
    value = amount;
  }
  
  // Check if it's a valid number
  if (isNaN(value)) return '0';
  
  // Format the number with the specified decimal places
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Formats a date to a human-readable string
 * @param date Date to format
 * @param format Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Converts a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}