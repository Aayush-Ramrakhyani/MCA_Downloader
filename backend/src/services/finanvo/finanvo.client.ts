/*
 * finanvo.client.ts
 * Singleton Axios-based HTTP client for the Finanvo API (api5.finanvo.in). Manages
 * the auth token, injects it on every request, logs all calls when DEBUG_API is on,
 * and normalizes Axios errors for upstream callers.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../../config/env';
import { logApiCall, logger } from '../../config/logger';

export class FinanvoClient {
  private http: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.http = axios.create({
      baseURL: env.finanvo.baseUrl,
      timeout: env.finanvo.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'app-origin': 'https://mcadownload.com', // required by Finanvo to identify the client app
      },
    });

    this.http.interceptors.request.use(config => {
      if (this.authToken) {
        config.headers['Authorization'] = this.authToken; // Finanvo expects raw JWT without "Bearer " prefix
      }
      return config;
    });
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  async get<T = unknown>(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const start = Date.now();
    try {
      const res = await this.http.get<T>(path, config);
      logApiCall({
        method: 'GET',
        url: path,
        statusCode: res.status,
        durationMs: Date.now() - start,
        responseBody: res.data,
      });
      return res;
    } catch (err) {
      this.handleError('GET', path, err, Date.now() - start);
      throw err;
    }
  }

  async post<T = unknown>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const start = Date.now();
    try {
      const res = await this.http.post<T>(path, data, config);
      logApiCall({
        method: 'POST',
        url: path,
        statusCode: res.status,
        durationMs: Date.now() - start,
        requestBody: data,
        responseBody: res.data,
      });
      return res;
    } catch (err) {
      this.handleError('POST', path, err, Date.now() - start);
      throw err;
    }
  }

  async getStream(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.http.get(path, { ...config, responseType: 'stream' }); // bypasses logApiCall; callers stream the body directly
  }

  private handleError(method: string, path: string, err: unknown, durationMs: number): void {
    if (axios.isAxiosError(err)) {
      logger.warn('Finanvo API error', {
        method,
        url: path,
        statusCode: err.response?.status,
        durationMs,
        message: err.message,
      });
    } else {
      logger.error('Unexpected Finanvo client error', { method, url: path, durationMs });
    }
  }
}

export const finanvoClient = new FinanvoClient(); // shared singleton; controllers call setAuthToken() before each request
