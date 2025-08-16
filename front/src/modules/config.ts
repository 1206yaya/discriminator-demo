/**
 * Configuration module for API endpoints
 */

/**
 * Get the API endpoint URL
 * @returns {string} API endpoint URL
 */
export function getApiEndpoint(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api'
  }
  
  // In production, you can customize this based on your deployment
  return process.env.VITE_API_ENDPOINT || 'http://localhost:3000/api'
}

/**
 * Get other configuration values as needed
 */
export const config = {
  apiEndpoint: getApiEndpoint(),
  // Add other configuration options here
}
