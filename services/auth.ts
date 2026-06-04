import { api } from "@/lib/api";

export async function demoSignInService() {
  await api.post("/auth/demo");
}
