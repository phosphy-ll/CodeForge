"use client";

const ACCESS_TOKEN_KEY = "codeforge_access_token";

export function saveAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function removeAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}