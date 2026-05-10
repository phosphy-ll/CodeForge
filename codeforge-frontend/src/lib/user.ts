import { api } from "@/lib/api";

export async function getMe() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return null;
    }

    throw error;
  }
}