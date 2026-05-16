import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

interface ApiErrorResponse {
  error: string;
}
export type ApiError = AxiosError<ApiErrorResponse>;
