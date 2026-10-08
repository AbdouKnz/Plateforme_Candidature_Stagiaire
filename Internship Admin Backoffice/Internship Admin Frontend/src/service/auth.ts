import axiosApi from "@/lib/axios";
import { LoginPayload, LogoutPayload, LoginResponse} from "@/models/auth-model";

export const LOGIN_ENDPOINT = `/auth/login`;
export const LOGOUT_ENDPOINT = `/auth/logout`;
export const REFRESH_TOKEN = "/auth/refresh-token"

export const login = async (loginData: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosApi.post(LOGIN_ENDPOINT, loginData);
  console.log("login-response", response.data);
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await axiosApi.post(REFRESH_TOKEN, {
    refresh_token: refreshToken,
  });
  return response.data;
};

export const logout = async (logoutData: LogoutPayload): Promise<void> => {
  await axiosApi.post(LOGOUT_ENDPOINT, logoutData);
};


