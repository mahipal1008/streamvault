export const config = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000',
  PROXY_URL: process.env.PROXY_URL,
  API_KEY: process.env.API_KEY,
}
