"use client";

const ACCESS_TOKEN_KEY = "codeforge_access_token";
const REFRESH_TOKEN_KEY = "codeforge_refresh_token";

export function saveAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function saveRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  saveAccessToken(accessToken);
  saveRefreshToken(refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function removeRefreshToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}