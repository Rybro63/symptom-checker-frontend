// The base URL of your deployed Symptom Checker API.
// Override at build time with a VITE_API_URL environment variable if you like;
// otherwise it falls back to your live AWS endpoint.
export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://dsfk8nnzl6.execute-api.us-east-1.amazonaws.com'
