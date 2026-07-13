import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  toggleFrontOffice,
  getFrontOfficeStatus,
  type FrontOfficeStatus,
} from "@/service/front-office";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useFrontOfficeStatus() {
  return useQuery<FrontOfficeStatus, Error>({
    queryKey: ["front_office_status"],
    queryFn: () => getFrontOfficeStatus(),
    retry: 1,
  } as UseQueryOptions<FrontOfficeStatus, Error>);
}

export function useToggleFrontOffice() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<unknown, Error, { is_enabled: boolean; reopening_date?: string }>({
    mutationFn: toggleFrontOffice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["front_office_status"] });
      showAlert({
        message: (data as any)?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}
