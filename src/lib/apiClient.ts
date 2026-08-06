import { API_BASE_URL } from '../config';

/**
 * A single place where API failures become *legible*.
 *
 * Previously every call did `const data = await res.json()` and wrapped the whole
 * thing in a try/catch that showed one generic message. That collapses completely
 * different failures — out of credits, server restarting, gateway timeout, an
 * unparseable PDF, an expired auth token — into the same unhelpful string, which
 * makes them impossible to diagnose from a user's screenshot.
 *
 * The two failures that were hardest to spot:
 *  - A 502/504 from the host returns an HTML error page. Calling res.json() on it
 *    throws a SyntaxError, so the catch block reported a "network" problem when
 *    the real answer was "the request timed out upstream".
 *  - A request that hangs forever never resolves at all, so the UI just sits in a
 *    loading state with no error ever shown.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  /** True when the failure looks like a timeout/gateway problem rather than a real API error. */
  isGateway: boolean;
  constructor(message: string, opts: { status?: number; code?: string; isGateway?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status ?? 0;
    this.code = opts.code;
    this.isGateway = opts.isGateway ?? false;
  }
}

/** Generous, because document extraction and tailoring are genuinely slow. */
const DEFAULT_TIMEOUT_MS = 150_000;

export const postJson = async <T = any>(
  path: string,
  body: unknown,
  opts: { headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<T> => {
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') {
      throw new ApiError(
        `This took longer than ${Math.round(timeoutMs / 1000)} seconds and was stopped. Very large documents can time out — try a smaller file.`,
        { isGateway: true },
      );
    }
    throw new ApiError("Couldn't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  // Read as text first: an error page is HTML, and res.json() would throw a
  // SyntaxError that tells us nothing about what actually went wrong.
  const raw = await res.text();
  const looksJson = raw.trim().startsWith('{') || raw.trim().startsWith('[');
  let parsed: any = null;
  if (looksJson) {
    try { parsed = JSON.parse(raw); } catch { /* fall through to the raw handling */ }
  }

  if (!res.ok) {
    // A clean API error carries its own message and code — prefer those.
    if (parsed?.error) {
      throw new ApiError(parsed.error, { status: res.status, code: parsed.code });
    }
    // Otherwise it's almost certainly the host, not the app.
    const gateway = res.status === 502 || res.status === 503 || res.status === 504;
    throw new ApiError(
      gateway
        ? `The server didn't respond in time (${res.status}). It may be restarting or the request was too large — wait a moment and try again.`
        : `The server returned an unexpected ${res.status} response.`,
      { status: res.status, isGateway: gateway },
    );
  }

  if (!parsed) {
    throw new ApiError(
      'The server returned a response the app could not read. This usually means it restarted mid-request — try again.',
      { status: res.status, isGateway: true },
    );
  }

  return parsed as T;
};
