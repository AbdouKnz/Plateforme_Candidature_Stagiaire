export interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  from_name: string;
  default_bcc: string;
}

export type MailConfigResponse = {
  message: string;
  data: MailConfig;
};