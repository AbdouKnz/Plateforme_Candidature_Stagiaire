import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { getMailConfig, updateMailConfig, testMailConfig } from "@/service/mail-config";
import { useState, useEffect } from "react";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function MailConfigForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
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

  const testMutation = useMutation({
    mutationFn: testMailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail_config"] });
      showAlert({ message: t("mail_config_test_ok"), type: AlertEnum.SUCCESS });
    },
    onError: (err: any) => {
      showAlert({ message: err?.response?.data?.message || t("mail_config_test_fail"), type: AlertEnum.ERROR });
    },
  });

  const handleTest = () => {
    testMutation.mutate(form);
  };

  const set = (key: keyof typeof form, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <div className="text-sm text-muted-foreground p-6">Loading...</div>;

  return (
    <div>
      <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="host">SMTP Host</Label>
            <Input id="host" value={form.host} onChange={e => set("host", e.target.value)} placeholder="smtp.example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input id="port" type="number" value={form.port} onChange={e => set("port", parseInt(e.target.value) || 0)} placeholder="587" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={e => set("username", e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From Email</Label>
            <Input id="from" value={form.from} onChange={e => set("from", e.target.value)} placeholder="noreply@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input id="from_name" value={form.from_name} onChange={e => set("from_name", e.target.value)} placeholder="no-reply" />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleTest} disabled={testMutation.isPending}>
              {testMutation.isPending ? <Loader2 className="size-4 animate-spin me-1.5" /> : null}
              {testMutation.isPending ? (t("testing") || "Testing...") : (t("test") || "Test & Save")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}