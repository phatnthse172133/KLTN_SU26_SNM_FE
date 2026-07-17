export interface AppError {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryable: boolean;
}

export { createAppError } from './errorMapper.mjs';
