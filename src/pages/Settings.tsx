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

function detectPlatform(): "android" | "ios" {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android";
}

const AutoCaptureSection = ({ phone }: { phone: string }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"android" | "ios">(detectPlatform());
  const [step, setStep] = useState<1 | 2>(1);
  const normalizedPhone = phone.replace(/\D/g, "");

  const macrodroidDeepLink = `macrodroid://template?import=${encodeURIComponent(JSON.stringify({
    m_name: "Saldin - Captura de Gastos",
    m_trigger: { type: "notification" },
    m_action: { type: "http_post", url: INJECT_URL, body: JSON.stringify({ secret: INJECT_SECRET, phone: normalizedPhone, text: "{nf_title} {nf_text}", source: "macrodroid" }) },
  }))}`;

  const handleAndroidStep1 = () => {
    window.open("https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid", "_blank");
    setTimeout(() => setStep(2), 800);
  };

  const handleAndroidStep2 = () => {
    // Deep link direto para o MacroDroid (funciona no Android nativo)
    // Fallback: abre a Play Store para o usuário navegar para o app
    const deepLink = macrodroidDeepLink;
    const fallback = "https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid";

    // Tenta o deep link; se não funcionar em 1.5s, mostra instrução manual
    const timer = setTimeout(() => {
      setStep(3 as any);
    }, 1500);

    try {
      window.location.href = deepLink;
      // Se navegou, cancela o timer
      setTimeout(() => clearTimeout(timer), 500);
    } catch {
      clearTimeout(timer);
      window.open(fallback, "_blank");
    }

    toast({ title: "Abrindo MacroDroid...", description: "Se nao abrir, siga as instrucoes abaixo." });
  };

  const handleIosActivate = () => {
    window.open("https://www.icloud.com/shortcuts/placeholder", "_blank");
    toast({ title: "Abrindo Atalhos...", description: "Toque em \"Adicionar\" e depois em \"Ativar\"." });
  };

  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
        Captura Automática de Gastos
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">

        {/* Hero */}
        <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 border-b border-border text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-foreground">Gastos registrados sozinhos</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Comprou no débito ou crédito? O Saldin detecta a notificação do banco e já registra — sem você fazer nada.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["android", "ios"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setStep(1); }}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-foreground border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "android" ? "📱 Android" : "🍎 iPhone"}
            </button>
          ))}
        </div>

        {/* Android */}
        {activeTab === "android" && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-muted")} />
              <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-muted")} />
              <span className="text-xs text-muted-foreground">{step}/2</span>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Instale o MacroDroid</p>
                    <p className="text-xs text-muted-foreground mt-0.5">App gratuito que conecta as notificações do banco ao Saldin. Instala uma vez e esquece.</p>
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={handleAndroidStep1}>
                  <ExternalLink className="w-4 h-4" />
                  Instalar MacroDroid (grátis)
                </Button>
                <button onClick={() => setStep(2)} className="w-full text-xs text-muted-foreground text-center hover:underline underline-offset-2">
                  Já tenho instalado → próximo passo
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Conecte ao Saldin</p>
                    <p className="text-xs text-muted-foreground mt-0.5">O MacroDroid abre com tudo configurado. Só toque em <strong>"Importar"</strong> e <strong>"Ativar"</strong>.</p>
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={handleAndroidStep2}>
                  <Zap className="w-4 h-4" />
                  Conectar ao MacroDroid
                </Button>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Pronto! Ativação em 2 toques.</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Cada notificação de compra chegará automaticamente no Saldin.</p>
                </div>
                <button onClick={() => setStep(1)} className="w-full text-xs text-muted-foreground text-center hover:underline underline-offset-2">← Voltar</button>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2 text-center">Funciona com os principais bancos</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Nubank", "Inter", "C6", "Itaú", "Bradesco", "Santander", "Caixa", "Mercado Pago"].map((b) => (
                  <span key={b} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* iOS */}
        {activeTab === "ios" && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200"><strong>Não precisa instalar nada.</strong> O app Atalhos já vem no iPhone.</p>
            </div>

            <div className="space-y-4">
              {[
                { n: 1, title: "Toque no botão abaixo", desc: "O iPhone pede para adicionar o atalho do Saldin. Toque em \"Adicionar\"." },
                { n: 2, title: "Ative a automação", desc: "No app Atalhos, vá em Automação e ative \"Saldin Captura\". Feito!" },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full gap-2" onClick={handleIosActivate}>
              <ExternalLink className="w-4 h-4" />
              Adicionar Atalho do Saldin
            </Button>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">2 toques e está ativo para sempre.</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Cada compra do banco chega automaticamente no Saldin.</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2 text-center">Funciona com os principais bancos</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Nubank", "Inter", "C6", "Itaú", "Bradesco", "Santander"].map((b) => (
                  <span key={b} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>
          </div>
        )}
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
