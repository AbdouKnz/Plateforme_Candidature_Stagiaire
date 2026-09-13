import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Server, LockKeyhole, Mail } from "lucide-react";
import { getMailConfig, updateMailConfig, testMailConfig } from "@/service/mail-config";
import { useState, useEffect } from "react";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import { usePermissions } from "@/hooks/use-permissions";

export function MailConfigForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const { modulePermissions } = usePermissions();
  const canEditMailConfig = modulePermissions.settings.canUpdate;
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ host: "", port: 587, username: "", password: "", from: "", from_name: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["mail_config"],
    queryFn: getMailConfig,
  });

  useEffect(() => {
    if (data) {
      setForm({ host: data.host || "", port: data.port || 587, username: data.username || "", password: data.password || "", from: data.from || "", from_name: data.from_name || "" });
    }
  }, [data]);

  const combinedMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await testMailConfig(data);
      await updateMailConfig(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail_config"] });
      showAlert({ message: t("mail_config_test_ok"), type: AlertEnum.SUCCESS });
    },
    onError: (err: any) => {
      showAlert({ message: err?.response?.data?.message || t("mail_config_test_fail"), type: AlertEnum.ERROR });
    },
  });

  const handleTestAndSave = () => {
    combinedMutation.mutate(form);
  };

  const set = (key: keyof typeof form, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <div className="text-sm text-muted-foreground p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Server Card */}
        <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Server className="size-4" />
            </div>
            <h3 className="text-sm font-semibold">SMTP Server</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input id="host" value={form.host} onChange={e => set("host", e.target.value)} placeholder="smtp.example.com" disabled={!canEditMailConfig} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" value={form.port} onChange={e => set("port", parseInt(e.target.value) || 0)} placeholder="587" disabled={!canEditMailConfig} />
            </div>
          </div>
        </Card>

        {/* Credentials Card */}
        <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LockKeyhole className="size-4" />
            </div>
            <h3 className="text-sm font-semibold">Credentials</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={e => set("username", e.target.value)} placeholder="user@example.com" disabled={!canEditMailConfig} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" disabled={!canEditMailConfig} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sender Card */}
      <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="size-4" />
          </div>
          <h3 className="text-sm font-semibold">Sender</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from">From Email</Label>
            <Input id="from" value={form.from} onChange={e => set("from", e.target.value)} placeholder="noreply@example.com" disabled={!canEditMailConfig} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input id="from_name" value={form.from_name} onChange={e => set("from_name", e.target.value)} placeholder="no-reply" disabled={!canEditMailConfig} />
          </div>
        </div>
      </Card>

      {/* Actions — edit access only */}
      {canEditMailConfig && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleTestAndSave} disabled={combinedMutation.isPending}>
            {combinedMutation.isPending ? <Loader2 className="size-4 animate-spin me-1.5" /> : null}
            {combinedMutation.isPending ? (t("testing") || "Testing...") : (t("test_save") || "Test & Save")}
          </Button>
        </div>
      )}
    </div>
  );
}