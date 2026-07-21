// The base URL of your deployed Symptom Checker API.
export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://dsfk8nnzl6.execute-api.us-east-1.amazonaws.com'

// Cognito configuration — fill these in from your `sam deploy` Outputs
// (UserPoolId and UserPoolClientId).
export const USER_POOL_ID =
  import.meta.env.VITE_USER_POOL_ID || 'us-east-1_HlcKYhKNq'
export const USER_POOL_CLIENT_ID =
  import.meta.env.VITE_USER_POOL_CLIENT_ID || '461phdibt0rhd2dklfsuca0mld'
