import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { supabase } from "@/lib/backendClient";
import { generateFinancialReport } from "@/lib/exportPdf";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncomes";
import { useDebts } from "@/hooks/useDebts";
import { useReceivables } from "@/hooks/useReceivables";
import { useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { useGoals, useGoalStats } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import {
  ChevronLeft,
  User,
  Mail,
  Crown,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Zap,
  TrendingUp,
  FileText,
  History,
  CreditCard,
  HelpCircle,
  FileQuestion,
  Shield,
  LogOut,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  Fingerprint,
  Trash2,
  Bitcoin,
  Camera,
  Loader2,
  Bell,
  Copy,
  ExternalLink
} from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCreditCards, useCardInstallmentsByMonth } from "@/hooks/useCreditCards";
import { exportToCSV } from "@/lib/exportData";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { useWhatsAppStatus } from "@/hooks/useWhatsAppStatus";

export const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const {
    isSupported: isBiometricSupported,
    isEnabled: isBiometricEnabled,
    registerBiometric,
    removeAllCredentials,
    getCredentialsForUser,
    isLoading: isBiometricLoading,
  } = useWebAuthn();

  const { data: allExpenses } = useExpenses("confirmed");
  const { data: allIncomes } = useIncomes();
  const { data: allDebts } = useDebts("active");
  const { data: allReceivables } = useReceivables("pending");
  const { data: allGoals } = useGoals("all");
  const { data: goalStats } = useGoalStats();
  const { data: allSubscriptions = [] } = useSubscriptions();
  const { data: ccInstallments = [] } = useCardInstallmentsByMonth(new Date());

  // Keep localStorage in sync with DB value
  useEffect(() => {
    if (profile?.ai_name && profile.ai_name !== preferences.aiName) {
      updatePreference("aiName", profile.ai_name);
    }
  }, [profile?.ai_name]);

  const [loggingOut, setLoggingOut] = useState(false);
  const [biometricActivating, setBiometricActivating] = useState(false);

  const { data: whatsappData, isLoading: isLoadingWhatsApp } = useWhatsAppStatus(user?.id);

  // Formata o número para exibição: 5561993984169 -> +55 61 99398-4169
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "Não configurado";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`;
    }
    if (cleaned.length === 12) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 8)}-${cleaned.substring(8)}`;
    }
    return `+${cleaned}`;
  };

  const whatsappStatus = {
    connected: whatsappData?.connected || false,
    number: formatPhoneNumber(whatsappData?.number || null),
  };

  // Alert preferences (local state for demo)
  const [impulseAlerts, setImpulseAlerts] = useState(true);
  const [highSpendAlerts, setHighSpendAlerts] = useState(true);

  // Get user's biometric credentials
  const userCredentials = user?.id ? getCredentialsForUser(user.id) : [];

  const hasBiometricEnabled = userCredentials.length > 0;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast({ title: "Foto de perfil atualizada!" });

    } catch (error: any) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear all React Query cache
      queryClient.clear();
      // Reset local preferences (darkMode + cryptoEnabled are preserved automatically)
      resetPreferences();
      // Sign out from Supabase
      await signOut();
      // Navigate to auth
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!user?.id || !user?.email) return;

    if (hasBiometricEnabled) {
      // Remove biometric
      removeAllCredentials(user.id);
      toast({
        title: "Biometria desativada",
        description: "Você precisará usar email e senha para entrar.",
      });
    } else {
      // Enable biometric
      setBiometricActivating(true);
      const success = await registerBiometric(user.id, user.email);
      setBiometricActivating(false);

      if (success) {
        toast({
          title: "Biometria ativada!",
          description: "Na próxima vez, use sua biometria para entrar.",
        });
      } else {
        toast({
          title: "Erro ao ativar",
          description: "Não foi possível ativar a biometria.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportPdf = async () => {
    try {
      toast({ title: "Gerando relatório..." });
      await generateFinancialReport({
        incomes: allIncomes || [],
        expenses: allExpenses || [],
        debts: allDebts || [],
        receivables: allReceivables || [],
        goals: allGoals || [],
        subscriptions: allSubscriptions,
        creditCardInstallments: ccInstallments as any,
        userName: user?.user_metadata?.full_name || profile?.full_name,
        selectedMonth: new Date(),
        goalsSaved: goalStats?.totalSaved || 0,
      });
      toast({ title: "PDF gerado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: creditCards = [] } = useCreditCards();

  const handleExportData = async () => {
    try {
      toast({ title: "Preparando dados..." });

      exportToCSV({
        incomes: allIncomes || [],
        expenses: allExpenses || [],
        debts: allDebts || [],
        receivables: allReceivables || [],
        goals: allGoals || [],
        bankAccounts: bankAccounts,
        creditCards: creditCards
      });

      toast({ title: "Arquivo CSV gerado com sucesso!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao exportar dados", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Configurações</h1>
        </div>
      </header>

      <main className="px-5 space-y-5">

        {/* Perfil e Foto */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-secondary">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                  {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || <User className="w-10 h-10" />}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-md">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*"
          />
          <h2 className="mt-3 text-lg font-semibold">{profile?.full_name || "Usuário"}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Bloco 1 - Conta */}
        <FadeIn>
          <SettingsSection title="Conta">
            <SettingsItem
              icon={User}
              label="Nome"
              value={profile?.full_name || user?.user_metadata?.full_name || "Usuário"}
            />
            <SettingsItem
              icon={Mail}
              label="Email"
              value={user?.email || "—"}
            />
            <SettingsItem
              icon={Crown}
              label="Plano atual"
              value="Grátis"
              badge="Upgrade"
              onClick={() => { }}
            />
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => navigate("/account/edit")}
              >
                <Edit2 className="w-4 h-4" />
                Editar conta
              </Button>
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco 2 - WhatsApp & Assistente */}
        <FadeIn delay={0.05}>
          <SettingsSection title="WhatsApp & Assistente">
            <SettingsItem
              icon={MessageCircle}
              label="Assistente"
              value="Saldin"
            />
            <SettingsItem
              icon={Smartphone}
              label="Número conectado"
              value={whatsappStatus.number}
            />
            <SettingsItem
              icon={whatsappStatus.connected ? CheckCircle2 : XCircle}
              iconColor={whatsappStatus.connected ? "text-essential" : "text-impulse"}
              label="Status"
              value={whatsappStatus.connected ? "Conectado" : "Desconectado"}
              valueColor={whatsappStatus.connected ? "text-essential" : "text-impulse"}
            />
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={openWhatsApp}
              >
                <RefreshCw className="w-4 h-4" />
                Reconectar
              </Button>
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco: Captura Automática de Gastos */}
        <FadeIn delay={0.08}>
          <AutoCaptureSection phone={whatsappData?.number || ""} />
        </FadeIn>

        {/* Bloco 3 - Segurança */}
        <FadeIn delay={0.1}>
          <SettingsSection title="Segurança">
            {isBiometricSupported && (
              <SettingsItem
                icon={Fingerprint}
                iconColor={hasBiometricEnabled ? "text-essential" : "text-muted-foreground"}
                label="Login por biometria"
                description={hasBiometricEnabled
                  ? `Ativado • ${userCredentials[0]?.deviceName || "Dispositivo"}`
                  : "Use impressão digital ou Face ID"
                }
                action={
                  <Switch
                    checked={hasBiometricEnabled}
                    disabled={biometricActivating || isBiometricLoading}
                    onCheckedChange={handleToggleBiometric}
                  />
                }
              />
            )}
            {!isBiometricSupported && (
              <SettingsItem
                icon={Fingerprint}
                iconColor="text-muted-foreground"
                label="Login por biometria"
                description="Seu dispositivo não suporta biometria"
              />
            )}
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Aparência */}
        <FadeIn delay={0.12}>
          <SettingsSection title="Aparência">
            <SettingsItem
              icon={preferences.darkMode ? Moon : Sun}
              iconColor={preferences.darkMode ? "text-primary" : "text-amber-500"}
              label="Modo escuro"
              description="Alterna entre tema claro e escuro"
              action={
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => updatePreference("darkMode", checked)}
                />
              }
            />
          </SettingsSection>
        </FadeIn>

        {/* Funcionalidades Extras */}
        <FadeIn delay={0.13}>
          <SettingsSection title="Funcionalidades extras">
            <SettingsItem
              icon={Bitcoin}
              iconColor={preferences.cryptoEnabled ? "text-[#F7931A]" : "text-muted-foreground"}
              label="Carteira de criptomoedas"
              description="Controle patrimonial de cripto"
              action={
                <Switch
                  checked={preferences.cryptoEnabled}
                  onCheckedChange={(checked) => updatePreference("cryptoEnabled", checked)}
                />
              }
            />
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Alertas */}
        <FadeIn delay={0.15}>
          <SettingsSection title="Alertas">
            <SettingsItem
              icon={Zap}
              iconColor="text-impulse"
              label="Alertas de impulso"
              description="Avisa quando gasto por impulso aumenta"
              action={
                <Switch
                  checked={impulseAlerts}
                  onCheckedChange={setImpulseAlerts}
                />
              }
            />
            <SettingsItem
              icon={TrendingUp}
              iconColor="text-accent"
              label="Alerta de gasto elevado"
              description="Avisa quando comprometer mais de 80% da renda"
              action={
                <Switch
                  checked={highSpendAlerts}
                  onCheckedChange={setHighSpendAlerts}
                />
              }
            />
            <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
              Alertas críticos não podem ser desativados
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Bloco 4 - Dados e Relatórios */}
        <FadeIn delay={0.15}>
          <SettingsSection title="Dados e Relatórios">
            <SettingsItem
              icon={FileText}
              label="Relatório PDF"
              description="Resumo mensal completo"
              onClick={handleExportPdf}
              showArrow
            />
            <SettingsItem
              icon={FileText}
              label="Exportar CSV/Excel"
              description="Planilha para análise detalhada"
              onClick={handleExportData}
              showArrow
            />
            <SettingsItem
              icon={History}
              label="Histórico completo"
              onClick={() => navigate("/history")}
              showArrow
            />
          </SettingsSection>
        </FadeIn>

        {/* Bloco 6 - Suporte e Legal */}
        <FadeIn delay={0.25}>
          <SettingsSection title="Suporte e Legal">
            <SettingsItem
              icon={HelpCircle}
              label="Ajuda"
              onClick={() => navigate("/help")}
              showArrow
            />
            <SettingsItem
              icon={FileQuestion}
              label="Termos de uso"
              onClick={() => navigate("/terms")}
              showArrow
            />
            <SettingsItem
              icon={Shield}
              label="Política de privacidade"
              onClick={() => navigate("/privacy")}
              showArrow
            />
            <SettingsItem
              icon={LogOut}
              iconColor="text-impulse"
              label={loggingOut ? "Saindo..." : "Sair da conta"}
              labelColor="text-impulse"
              onClick={handleLogout}
            />
          </SettingsSection>
        </FadeIn>

        {/* Product Tagline */}
        <FadeIn delay={0.3}>
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground italic">
              "Você fala com a IA. Você encara a verdade no app."
            </p>
            <p className="text-xs text-muted-foreground mt-1">v1.0.0</p>
          </div>
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
};

// ─── AutoCaptureSection ───

const INJECT_URL = "https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification";
const INJECT_SECRET = "saldin_inject_2026";

const AutoCaptureSection = ({ phone }: { phone: string }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const normalizedPhone = phone.replace(/\D/g, "");

  const macrodroidBody = JSON.stringify({
    secret: INJECT_SECRET,
    phone: normalizedPhone || "55XXXXXXXXXXX",
    text: "{nf_title} {nf_text}",
    source: "macrodroid",
  }, null, 2);

  const curlTest = `curl -X POST ${INJECT_URL} \\
  -H "Content-Type: application/json" \\
  -d '{ "secret": "${INJECT_SECRET}", "phone": "${normalizedPhone || '55XXXXXXXXXXX'}", "text": "Nubank: Compra aprovada R$ 50,00 no IFOOD", "source": "teste" }'`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
        Captura Automática de Gastos
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">

        {/* Header explicativo */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Registro automático via notificação</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Quando chegar uma notificação de compra do banco, o Saldin registra e confirma no seu WhatsApp — sem você digitar nada.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Android / iOS */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("android")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "android"
                ? "text-foreground border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            📱 Android
          </button>
          <button
            onClick={() => setActiveTab("ios")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "ios"
                ? "text-foreground border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🍎 iPhone
          </button>
        </div>

        {/* Android Content */}
        {activeTab === "android" && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Passo 1</p>
              <p className="text-sm text-muted-foreground">Baixe o <strong className="text-foreground">MacroDroid</strong> na Play Store (gratuito).</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => window.open("https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid", "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Play Store
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Passo 2</p>
              <p className="text-sm text-muted-foreground">No MacroDroid, crie uma nova Macro com:</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Gatilho:</span>
                  <span className="text-muted-foreground"> Notificação Recebida → Apps: Nubank, Inter, C6, Bradesco, Itaú</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Ação:</span>
                  <span className="text-muted-foreground"> HTTP POST com o corpo abaixo</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">URL do Endpoint</p>
                <button
                  onClick={() => copyToClipboard(INJECT_URL, "URL")}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
              <div className="bg-muted rounded-lg p-2 text-xs font-mono text-muted-foreground break-all">
                {INJECT_URL}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Corpo JSON (Body)</p>
                <button
                  onClick={() => copyToClipboard(macrodroidBody, "JSON")}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                {macrodroidBody}
              </pre>
              <p className="text-xs text-muted-foreground">
                <strong>⚠️ Substitua</strong> <code className="bg-muted px-1 rounded">phone</code> pelo seu número já incluído acima.
              </p>
            </div>
          </div>
        )}

        {/* iOS Content */}
        {activeTab === "ios" && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Não precisa instalar nada</p>
              <p className="text-sm text-muted-foreground">
                O app <strong className="text-foreground">Atalhos</strong> já vem instalado no iPhone. Siga os passos abaixo.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { step: "1", title: "Abra o app Atalhos", desc: "Procure por \"Atalhos\" na tela inicial do seu iPhone." },
                { step: "2", title: "Crie uma Automação Pessoal", desc: "Vá em \"Automação\" → \"Criar Automação Pessoal\" → \"App\"." },
                { step: "3", title: "Escolha o banco", desc: "Selecione o app do banco (Nubank, Inter, etc.) e escolha \"Ao Abrir\" + active pela notificação." },
                { step: "4", title: "Adicione ação HTTP", desc: "Adicione \"Buscar Conteúdo de URL\" com método POST e o endpoint abaixo." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">URL do Endpoint</p>
                <button
                  onClick={() => copyToClipboard(INJECT_URL, "URL")}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
              <div className="bg-muted rounded-lg p-2 text-xs font-mono text-muted-foreground break-all">
                {INJECT_URL}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>💡 Dica:</strong> No iOS 17+, a automação pede confirmação na primeira vez. Depois, roda automaticamente para sempre.
              </p>
            </div>
          </div>
        )}

        {/* Teste Manual */}
        <div className="border-t border-border p-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Testar agora</p>
          <p className="text-xs text-muted-foreground mb-3">
            Copie o comando abaixo e rode no terminal para testar se está funcionando:
          </p>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all pr-10">
              {curlTest}
            </pre>
            <button
              onClick={() => copyToClipboard(curlTest, "Comando")}
              className="absolute top-2 right-2 p-1.5 rounded bg-background border border-border hover:bg-muted transition-colors"
            >
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Se funcionar, o Saldin vai te enviar uma confirmação no WhatsApp! ✅
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Components

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <div>
    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
      {title}
    </h2>
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      {children}
    </div>
  </div>
);

interface SettingsItemProps {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  labelColor?: string;
  description?: string;
  value?: string;
  valueColor?: string;
  badge?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
  locked?: boolean;
}

const SettingsItem = ({
  icon: Icon,
  iconColor,
  label,
  labelColor,
  description,
  value,
  valueColor,
  badge,
  action,
  onClick,
  showArrow,
  locked,
}: SettingsItemProps) => {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left border-b border-border last:border-b-0",
        onClick && "hover:bg-secondary/50 transition-colors",
        locked && "opacity-60"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
        locked ? "bg-muted" : "bg-muted"
      )}>
        <Icon className={cn("w-4 h-4", iconColor || "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", labelColor)}>{label}</p>
          {badge && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {value && !action && (
        <span className={cn("text-sm truncate max-w-[140px] text-right", valueColor || "text-muted-foreground")}>{value}</span>
      )}
      {action}
      {locked && <Lock className="w-4 h-4 text-muted-foreground" />}
      {showArrow && !locked && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </Wrapper>
  );
};

export default Settings;
