import axiosApi from "@/lib/axios";
import { Setting, SettingResponse } from "@/models/setting-model";

const SETTING_ENDPOINT = `/settings`;

export const getSettings = async (): Promise<Setting[]> => {
  console.log("Fetching settings...");
  const response = await axiosApi.get(SETTING_ENDPOINT+"/");
  console.log("Fetching settings response:", response?.data);
  return response?.data?.data;
};

export const updateSetting = async (
  group: string,
  key: string,
  settingData: Partial<Setting>
): Promise<SettingResponse> => {
  console.log("Updating setting:", group, key, settingData);
  const response = await axiosApi.put(
    `${SETTING_ENDPOINT}/${group}/${key}`,
    settingData
  );
  return response?.data;
};
