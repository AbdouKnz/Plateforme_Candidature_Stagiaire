import axiosApi from "@/lib/axios";
import { Role, Module, RoleResponse, reassigneRole, RoleQueryParams } from "@/models/role-model";

const ROLE_ENDPOINT = `/roles`;
const MODULE_ENDPOINT = `/modules`;

export const getRoles = async (params?: RoleQueryParams): Promise<Role[]> => {
  console.log("************params",params)
  const response = await axiosApi.get(ROLE_ENDPOINT+"/", { params });
  console.log("fetching roles response: ", response?.data);
  return response?.data?.data;
};

export const getModules = async (): Promise<Module[]> => {
  const response = await axiosApi.get(MODULE_ENDPOINT+"/");
  console.log("fetching modules response: ", response?.data);
  return response?.data?.data;
};


export const getRoleById = async (id: number): Promise<Role> => {
  const response = await axiosApi.get(`${ROLE_ENDPOINT}/${id}`);
  console.log(`fetching role response: `, response?.data);
  return response?.data?.data;
};

export const createRole = async (roleData: Partial<Role>): Promise<RoleResponse> => {
  console.log("creating role data: ", roleData);
  const response = await axiosApi.post(ROLE_ENDPOINT+"/", roleData);
  return response?.data;
};

export const updateRole = async (roleId: number, roleData: Partial<Role>): Promise<RoleResponse> => {
  console.log(`updating role ${roleId} with data: `, roleData);
  const response = await axiosApi.put(`${ROLE_ENDPOINT}/${roleId}`, roleData);
  return response?.data;
};

export const deleteRole = async (roleId: number): Promise<RoleResponse> => {
  console.log(`deleting role with id: ${roleId}`);
  const response = await axiosApi.delete(`${ROLE_ENDPOINT}/${roleId}`);
  return response?.data;
};


export const reassigneUsersRole = async (roleData: reassigneRole): Promise<RoleResponse> => {
  console.log(`Reassigning users role: `, roleData);
  const response = await axiosApi.put(`${ROLE_ENDPOINT}/reassign_role`, roleData);
  return response?.data;
};