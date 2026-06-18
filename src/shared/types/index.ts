// Shared Layer - Types
// This directory contains global TypeScript type declarations and interfaces used across multiple layers.

export type Nullable<T> = T | null;

export interface BaseResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
