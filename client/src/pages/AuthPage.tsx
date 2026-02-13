import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Redirect } from "wouter";
import { LanguageToggle } from "@/components/LanguageToggle";
import logoUrl from "../../../logo.png";

function isOnboardingComplete(user: any) {
  if (!user) return false;
  if (typeof user.onboardingCompleted === "boolean") return user.onboardingCompleted;
  return Boolean(user.displayName && user.region);
}

const strongPassword = (value: string) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function AuthPage() {
  const { lang } = useLanguage();
  const { user, isLoading, loginWithPassword, signupWithPassword, forgotPassword, resetPassword, loginWithGoogle, isLoggingInWithPassword, isSigningUpWithPassword, isForgettingPassword, isResettingPassword, isGoogleLoading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const isPt = lang === "pt-BR";

  const labels = useMemo(() => ({
    title: isPt ? "Acesse sua conta" : "Access your account",
    subtitle: isPt ? "Entre com e-mail e senha ou crie sua conta em segundos." : "Sign in with email and password or create your account in seconds.",
    email: isPt ? "E-mail" : "Email",
    password: isPt ? "Senha" : "Password",
    confirmPassword: isPt ? "Confirmar senha" : "Confirm password",
    enter: isPt ? "Entrar" : "Sign in",
    create: isPt ? "Criar conta" : "Create account",
    forgot: isPt ? "Esqueci minha senha" : "Forgot my password",
    backToLogin: isPt ? "Voltar para login" : "Back to sign in",
    requestOtp: isPt ? "Enviar código" : "Send code",
    resetPassword: isPt ? "Redefinir senha" : "Reset password",
    resetCode: isPt ? "Código de 6 dígitos" : "6-digit code",
    newPassword: isPt ? "Nova senha" : "New password",
    googleMissing: isPt ? "Google login em breve. Continue com e-mail e senha." : "Google login coming soon. Please use email and password.",
    genericError: isPt ? "Não conseguimos concluir agora. Tente novamente." : "We couldn't complete this right now. Please try again.",
    weakPassword: isPt ? "A senha precisa ter no mínimo 8 caracteres, com letra, número e símbolo." : "Password must be at least 8 characters long and include a letter, number, and symbol.",
    mismatch: isPt ? "A confirmação da senha não confere." : "Password confirmation does not match.",
    resetInfo: isPt ? "Se existir uma conta com este e-mail, enviaremos um código." : "If an account exists with this email, we'll send a code.",
    resetSuccess: isPt ? "Senha atualizada com sucesso. Faça login com sua nova senha." : "Password updated successfully. Sign in with your new password.",
  }), [isPt]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            setError(labels.genericError);
            return;
          }
          setError(null);
          await loginWithGoogle({ idToken: credential }).catch(() => setError(labels.genericError));
        },
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "320",
        text: "continue_with",
      });
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId, labels.genericError, loginWithGoogle]);

  if (!isLoading && user) return <Redirect to={isOnboardingComplete(user) ? "/app" : "/onboarding"} />;

  const isBusy = isLoggingInWithPassword || isSigningUpWithPassword || isForgettingPassword || isResettingPassword || isGoogleLoading;

  function toHumanError(code: string) {
    const map: Record<string, string> = {
      INVALID_CREDENTIALS: isPt ? "E-mail ou senha inválidos." : "Invalid email or password.",
      EMAIL_ALREADY_REGISTERED: isPt ? "Este e-mail já possui conta." : "This email is already registered.",
      WEAK_PASSWORD: labels.weakPassword,
      PASSWORD_MISMATCH: labels.mismatch,
      OTP_INVALID_OR_EXPIRED: isPt ? "Código inválido ou expirado. Solicite um novo." : "Invalid or expired code. Please request a new one.",
      EMAIL_SERVICE_UNAVAILABLE: isPt ? "Nosso serviço de e-mail está indisponível no momento." : "Our email service is currently unavailable.",
      RATE_LIMITED: isPt ? "Muitas tentativas em pouco tempo. Aguarde um pouco." : "Too many attempts in a short time. Please wait a bit.",
      GOOGLE_AUTH_NOT_CONFIGURED: labels.googleMissing,
    };
    return map[code] ?? labels.genericError;
  }

  async function submitPasswordAuth() {
    setError(null);
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      if (!strongPassword(password)) return setError(labels.weakPassword);
      if (password !== confirmPassword) return setError(labels.mismatch);
      await signupWithPassword({ email: normalizedEmail, password, confirmPassword });
      return;
    }

    await loginWithPassword({ email: normalizedEmail, password });
  }

  async function submitForgotPassword() {
    setError(null);
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    const response = await forgotPassword(normalizedEmail);
    setMessage(response.message || labels.resetInfo);
  }

  async function submitResetPassword() {
    setError(null);
    setMessage(null);
    if (!strongPassword(newPassword)) return setError(labels.weakPassword);

    await resetPassword({ email: email.trim().toLowerCase(), otp: otp.trim(), newPassword });
    setMessage(labels.resetSuccess);
    setResetMode(false);
    setOtp("");
    setNewPassword("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto flex flex-col items-center gap-2">
            <img src={logoUrl} alt="PetCrushes" className="w-full max-w-[230px] h-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">{resetMode ? labels.resetPassword : labels.title}</CardTitle>
            <CardDescription>{resetMode ? labels.resetInfo : labels.subtitle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!resetMode ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")}>{labels.enter}</Button>
                <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>{labels.create}</Button>
              </div>

              <Input type="email" placeholder={labels.email} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isBusy} />
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder={labels.password} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isBusy} />
                <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === "signup" ? (
                <>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder={labels.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isBusy} />
                    <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowConfirmPassword((v) => !v)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    <li>{isPt ? "mínimo 8 caracteres" : "minimum 8 characters"}</li>
                    <li>{isPt ? "pelo menos 1 letra" : "at least 1 letter"}</li>
                    <li>{isPt ? "pelo menos 1 número" : "at least 1 number"}</li>
                    <li>{isPt ? "pelo menos 1 símbolo" : "at least 1 symbol"}</li>
                  </ul>
                </>
              ) : null}

              <Button className="w-full h-11" onClick={() => submitPasswordAuth().catch((e) => setError(toHumanError(String(e.message))))} disabled={isBusy}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? labels.enter : labels.create}
              </Button>

              <Button variant="ghost" className="px-0 justify-start" onClick={() => { setResetMode(true); setMessage(null); setError(null); }}>
                {labels.forgot}
              </Button>
            </>
          ) : (
            <>
              <Input type="email" placeholder={labels.email} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isBusy} />
              <Input inputMode="numeric" maxLength={6} placeholder={labels.resetCode} value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isBusy} />
              <Input type="password" placeholder={labels.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isBusy} />

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => submitForgotPassword().catch((e) => setError(toHumanError(String(e.message))))} disabled={isBusy}>{labels.requestOtp}</Button>
                <Button onClick={() => submitResetPassword().catch((e) => setError(toHumanError(String(e.message))))} disabled={isBusy}>{labels.resetPassword}</Button>
              </div>

              <Button variant="ghost" className="px-0 justify-start" onClick={() => setResetMode(false)}>{labels.backToLogin}</Button>
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <div className="space-y-2 pt-2">
            <div ref={googleButtonRef} className="flex justify-center" />
            {!googleClientId ? (
              <Button variant="outline" onClick={() => setError(labels.googleMissing)}>Continuar com Google (em breve)</Button>
            ) : null}
            <Button variant="outline" disabled>Continuar com Apple (em breve)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
