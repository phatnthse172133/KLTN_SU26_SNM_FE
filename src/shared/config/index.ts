// Shared Layer - Config
// This directory contains environment variables configurations and validation logic.

export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  APP_NAME: 'KLTN SU26 SNM FE',
} as const;
