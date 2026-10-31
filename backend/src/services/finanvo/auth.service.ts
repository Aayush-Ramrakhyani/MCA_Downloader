/*
 * auth.service.ts
 * Handles Finanvo authentication: logging in with credentials, extracting the
 * session token from the response (path is configurable via FINANVO_TOKEN_PATH),
 * logging out, and auto-login on server startup using environment credentials.
 */
import { FinanvoLoginRequest, FinanvoLoginResponse } from './types';
import { finanvoClient } from './finanvo.client';
import { env } from '../../config/env';
import { getNestedValue } from '../../utils/sanitize';
import { logger } from '../../config/logger';

/**
 * STATUS: IMPLEMENTED (token extraction path is configurable)
 *
 * If login succeeds but token extraction fails, set FINANVO_TOKEN_PATH
 * in .env to the correct dot-notation path visible in the DevTools
 * Network response (e.g. "data.token" or "access_token").
 */
export async function loginToFinanvo(email: string, password: string): Promise<string> {
  const payload: FinanvoLoginRequest = { email, password };

  let responseData: FinanvoLoginResponse;
  try {
    const res = await finanvoClient.post<FinanvoLoginResponse>('/user/login', payload);
    responseData = res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 || status === 403 || status === 404) {
      throw new Error('INVALID_CREDENTIALS: Email or password is incorrect.');
    }
    throw new Error(`LOGIN_FAILED: ${(err as Error).message}`);
  }

  const token = extractToken(responseData);
  finanvoClient.setAuthToken(token);
  logger.info('Successfully authenticated with Finanvo API');
  return token;
}

/**
 * Attempts to extract the auth token from the Finanvo login response.
 *
 * Uses FINANVO_TOKEN_PATH from .env (default: "token").
 * If the configured path does not yield a string, logs the response keys
 * (without values) to help the user identify the correct path.
 */
function extractToken(response: FinanvoLoginResponse): string {
  const tokenPath = env.finanvo.tokenPath;
  const value = getNestedValue(response, tokenPath);

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  // Log the top-level keys (not values) to help identify the correct path without leaking secrets
  const topLevelKeys = Object.keys(response);
  logger.error(
    'Token extraction failed. The field at FINANVO_TOKEN_PATH was not a non-empty string.',
    {
      configuredPath: tokenPath,
      topLevelKeysInResponse: topLevelKeys,
      hint: 'Set FINANVO_TOKEN_PATH in .env to the correct path, e.g. "data.token"',
    },
  );

  throw new Error(
    `TOKEN_EXTRACTION_FAILED: Could not find auth token at path "${tokenPath}". ` +
    `Top-level response keys: [${topLevelKeys.join(', ')}]. ` +
    `Update FINANVO_TOKEN_PATH in .env with the correct dot-notation path.`,
  );
}

export async function logoutFromFinanvo(): Promise<void> {
  finanvoClient.clearAuthToken();
  logger.info('Cleared Finanvo auth token');
}

/**
 * Uses configured .env credentials to authenticate as the app's
 * service account. Called during server startup if credentials are set.
 */
export async function loginWithEnvCredentials(): Promise<string | null> {
  const { email, password } = env.finanvo;
  if (!email || !password) {
    logger.warn('FINANVO_EMAIL or FINANVO_PASSWORD not set — skipping auto-login');
    return null;
  }
  return loginToFinanvo(email, password);
}
