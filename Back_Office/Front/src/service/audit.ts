import axiosApi from "@/lib/axios";
import { FileType } from "@/models/export-model";
import { Audit, AuditQueryParams, AuditResponse } from "@/models/audit-model";
import { createDownloadLink } from "@/lib/utils";

const AUDIT_ENDPOINT = `/audits`;


export const getAudits = async (params?: AuditQueryParams): Promise<AuditResponse> => {
  const response = await axiosApi.get(AUDIT_ENDPOINT+"/", { params });
  console.log("fetching audits response: ", response?.data);
  return response?.data;
};

export const getAuditById = async (id: number): Promise<Audit> => {
  const response = await axiosApi.get(`${AUDIT_ENDPOINT}/${id}`);
  console.log(`fetching audit response: `, response?.data);
  return response?.data?.data;
};




export const exportAudits = async (
  fileType: FileType,
  params?: AuditQueryParams
): Promise<void> => {
  try {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();

    const url = `${AUDIT_ENDPOINT}/export?file_type=${fileType}${
      queryParams ? `&${queryParams}` : ""
    }`;

    console.log("export audits URL:", url);

    const response = await axiosApi.post(url, null, {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `audits.${fileType === "pdf" ? "pdf" : "xlsx"}`;

    createDownloadLink(new Blob([response.data]), filename);
  } catch (error: any) {
    console.error("Error exporting audits:", error);
    throw error;
  }
};
