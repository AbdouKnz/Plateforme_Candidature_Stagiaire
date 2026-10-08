import axiosApi from "@/lib/axios";
import { createDownloadLink } from "@/lib/utils";
import { FileType } from "@/models/export-model";
import { ChangePasswordPayload, User, UserQueryParams, UserResponse, UserStatus } from "@/models/user-model";

const USER_ENDPOINT = `/users`;

export const getUsers = async (params?: UserQueryParams): Promise<UserResponse> => {
  console.log("************params",params)
  const response = await axiosApi.get(USER_ENDPOINT+"/", { params });
  console.log("fetching users response: ", response?.data);
  return response?.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await axiosApi.get(`${USER_ENDPOINT}/${id}`);
  console.log(`fetching user ${id} response: `, response?.data);
  return response?.data?.data;
};

export const createUser = async (userData: Partial<User>): Promise<UserResponse> => {
  const response = await axiosApi.post(USER_ENDPOINT+"/", userData);
  return response?.data;
};


export const updateUser = async (userId: number,userData: Partial<User>): Promise<UserResponse> => {
  console.log("updating user data: ", userData);
  const response = await axiosApi.put(`${USER_ENDPOINT}/${userId}`, userData);
  return response?.data;
};

export const updateUserStatus = async (userId: number, status: UserStatus): Promise<UserResponse> => {
  console.log("Updating user status: ", status);
  const response = await axiosApi.put(`${USER_ENDPOINT}/${userId}/status`, { status });
  return response?.data;
};

export const deleteUser = async (userId: number): Promise<UserResponse> => {
  console.log(`Deleting user with id: ${userId}`);
  const response = await axiosApi.delete(`${USER_ENDPOINT}/${userId}`);
  return response?.data;
};

export const exportUsers = async (
  fileType?: FileType,
  params?: UserQueryParams
): Promise<void> => {
  try {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();

    const url = `${USER_ENDPOINT}/export?file_type=${fileType}${
      queryParams ? `&${queryParams}` : ""
    }`;

    console.log("export URL:", url);

    const response = await axiosApi.post(url, null, {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `users.${fileType === "pdf" ? "pdf" : "xlsx"}`;

    createDownloadLink(new Blob([response.data]), filename);
  } catch (error: any) {
    console.error("Error exporting users:", error);
    throw error;
  }
};


export const changePassword = async (userId: number, payload: ChangePasswordPayload): Promise<UserResponse> => {
  const response = await axiosApi.put(`${USER_ENDPOINT}/${userId}/password`, payload);
  return response.data;
};