"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getModules,
  reassigneUsersRole,
} from "@/service/roles";
import { Role, Module, RoleResponse, reassigneRole, RoleQueryParams } from "@/models/role-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { ID } from "@/models/api";
import { useAlertStore } from "@/stores/alert-store";

export function useRoles(params?: RoleQueryParams) {
  return useQuery<Role[], Error>({
    queryKey: ["roles", params],
    queryFn: () => getRoles(params),
    retry: 1,
    onError: (error: Error) => {
      console.error("Error fetching roles:", error);
    },
  } as UseQueryOptions<Role[], Error>);
}


export function useModules() {
  return useQuery<Module[], Error>({
    queryKey: ["modules"],
    queryFn: getModules,
    retry: 1,
    onError: (error: Error) => {
      console.error("Error fetching modules:", error);
    },
  } as UseQueryOptions<Module[], Error>);
}



export function useRole(id: ID) {
  const { showAlert } = useAlertStore();

  return useQuery<Role, AxiosError>({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id!),
    enabled: !!id,
    retry: 1,
    onError: (error: any) => {
      console.error(`Error fetching role ${id}:`, error.message);
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  } as UseQueryOptions<Role, AxiosError>);
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<RoleResponse, Error, Partial<Role>>({
    mutationFn: createRole,
    onSuccess: (data) => {
      console.log("Role created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      console.error("Error creating role:", error.message);
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<RoleResponse, Error, { id: number; data: Partial<Role> }>({
    mutationFn: ({ id, data }) => updateRole(id, data),
    onSuccess: (data, variables) => {
      console.log("Role updated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      console.error("Error updating role:", error.message);
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<RoleResponse, Error, number>({
    mutationFn: (id) => deleteRole(id),
    onSuccess: (data) => {
      console.log("Role deleted successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      console.error("Error deleting role:", error.message);
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}


export function useReassignUsersRole() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<RoleResponse, Error, reassigneRole>({
    mutationFn: (roleData) => reassigneUsersRole(roleData),
    onSuccess: (data) => {
      console.log("Users reassigned role successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
     
    },
    onError: (error: any) => {
      console.error("Error reassigning users role:", error.message);
      showAlert({
        message: error?.response?.data?.error || "Failed to reassign users.",
        type: AlertEnum.ERROR,
      });
    },
  });
}
