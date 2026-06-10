const Users = require("../models/userModel");

const DEFAULT_BASE_URL = "https://api.aibeacon.kooistra.ch";

class AiBeaconApiError extends Error {
  constructor({ message, status, url, responseBody }) {
    super(message);
    this.name = "AiBeaconApiError";
    this.status = status;
    this.url = url;
    this.responseBody = responseBody;
  }
}

function normalizeApiKey(apiKey) {
  const value = String(apiKey || "").trim();
  if (!value) return "";
  // API docs indicate: `Authorization: Bearer ab_<token>`
  // Some callers might store `<token>` while others might already store `ab_<token>`.
  if (value.startsWith("ab_")) return value;
  return `ab_${value}`;
}

function buildAuthHeaders(apiKey) {
  const bearer = normalizeApiKey(apiKey);
  return {
    Authorization: `Bearer ${bearer}`,
  };
}

function buildUrl({ baseUrl, path, query }) {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(withLeadingSlash, baseUrl);

  if (query && typeof query === "object") {
    for (const [key, val] of Object.entries(query)) {
      if (val === undefined || val === null) continue;
      url.searchParams.set(key, String(val));
    }
  }

  return url;
}

function createAiBeaconApiClient(apiKey, options = {}) {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const requestTimeoutMs = options.requestTimeoutMs || 30000;

  const defaultHeaders = {
    Accept: "application/json",
    ...buildAuthHeaders(apiKey),
  };

  async function request({ path, method = "GET", query, body, headers }) {
    const url = buildUrl({ baseUrl, path, query });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          ...defaultHeaders,
          ...(headers || {}),
          // If caller didn't set Content-Type but we are sending JSON, set it.
          ...(body !== undefined && body !== null && !headers?.["Content-Type"]
            ? { "Content-Type": "application/json" }
            : {}),
        },
        signal: controller.signal,
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const responseBody = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        throw new AiBeaconApiError({
          message: `AI Beacon request failed (${res.status}) for ${method} ${url.pathname}`,
          status: res.status,
          url: url.toString(),
          responseBody,
        });
      }

      return responseBody;
    } catch (err) {
      // If fetch threw due to abort, surface a consistent error.
      if (err && err.name === "AbortError") {
        throw new AiBeaconApiError({
          message: `AI Beacon request timed out after ${requestTimeoutMs}ms for ${method} ${path}`,
          status: 504,
          url: baseUrl,
          responseBody: null,
        });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    baseUrl,
    request,
    get: (path, query, extraHeaders) =>
      request({ path, method: "GET", query, headers: extraHeaders }),
    post: (path, body, query, extraHeaders) =>
      request({ path, method: "POST", query, body, headers: extraHeaders }),
    put: (path, body, query, extraHeaders) =>
      request({ path, method: "PUT", query, body, headers: extraHeaders }),
    delete: (path, query, extraHeaders) =>
      request({ path, method: "DELETE", query, headers: extraHeaders }),
  };
}

async function createAiBeaconApiClientForUser(userId, options = {}) {
  const user = await Users.findById(userId).select("+aiBeaconApiKey");
  if (!user) {
    throw new Error("User not found");
  }

  const apiKey = user.getAiBeaconApiKey();
  if (!apiKey) {
    throw new Error("User does not have an AI Beacon API key configured");
  }

  return createAiBeaconApiClient(apiKey, options);
}

async function createAiBeaconReadOnlyApiClientForUser(userId, options = {}) {
  const user = await Users.findById(userId).select("+aiBeaconReadOnlyApiKey");
  if (!user) {
    throw new Error("User not found");
  }

  const apiKey = user.getAiBeaconReadOnlyApiKey();
  if (!apiKey) {
    throw new Error("User does not have an AI Beacon read-only API key configured");
  }

  return createAiBeaconApiClient(apiKey, options);
}

module.exports = {
  DEFAULT_BASE_URL,
  AiBeaconApiError,
  createAiBeaconApiClient,
  createAiBeaconApiClientForUser,
  createAiBeaconReadOnlyApiClientForUser,
};
