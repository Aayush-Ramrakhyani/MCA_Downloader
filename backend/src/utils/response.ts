import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export function success<T>(res: Response, data: T, message?: string, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function error(
  res: Response,
  message: string,
  status = 500,
  errors?: unknown[],
): Response {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}
