import { api } from "@/lib/api";

export async function demoSignInService() {
  await api.post("/auth/demo");
}

export async function demoSignOutService() {
  await api.post("/auth/demo/logout");
}

interface MeResponse {
  name: string;
  email: string;
  isDemo: boolean;
}

export async function getMeService(): Promise<MeResponse> {
  const { data } = await api.get<{ data: MeResponse }>("/auth/me");
  return data.data;
}
