"use client";

const SELECTED_GOAL_KEY = "codeforge_selected_goal_id";

export function saveSelectedGoalId(goalId: number) {
  localStorage.setItem(SELECTED_GOAL_KEY, String(goalId));
}

export function getSelectedGoalId(): number | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(SELECTED_GOAL_KEY);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function removeSelectedGoalId() {
  localStorage.removeItem(SELECTED_GOAL_KEY);
}