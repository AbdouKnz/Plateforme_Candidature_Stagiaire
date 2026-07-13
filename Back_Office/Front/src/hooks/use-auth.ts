import { useMutation } from "@tanstack/react-query";
import { login, logout } from "@/service/auth";
import {
  LoginResponse,
  LoginPayload,
  LogoutPayload,
} from "@/models/auth-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAuthStore } from "@/stores/auth-store";
import { useAlertStore } from "@/stores/alert-store";
import { useRouter } from "@tanstack/react-router";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showAlert } = useAlertStore();

  return useMutation<
    LoginResponse,
    AxiosError<{ error: string }>,
    LoginPayload
  >({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      router.navigate({ to: "/" });
    },
    onError: (error: any) => {
      console.error("Login failed: ", error?.response?.data?.error);
      showAlert({
        message: error?.response?.data?.error || "Login failed. Please try again.",
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { showAlert } = useAlertStore();

  return useMutation<void, AxiosError<{ error: string }>, LogoutPayload>({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      router.navigate({ to: "/sign-in" }); 
    },
    onError: (error: any) => {
      console.error("Logout failed: ", error?.response?.data?.error);
      showAlert({
        message: error?.response?.data?.error || "Logout failed. Please try again.",
        type: AlertEnum.ERROR,
      });
    },
  });
}
