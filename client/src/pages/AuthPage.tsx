import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { LanguageToggle } from "@/components/LanguageToggle";

function isOnboardingComplete(user: any) {
  if (!user) return false;
  if (typeof user.onboardingCompleted === "boolean") return user.onboardingCompleted;
  return Boolean(user.displayName && user.whatsapp && user.region);
}

const strongPassword = (value: string) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

export default function AuthPage() {
  const { t } = useLanguage();
  const { user, isLoading, checkAuthExists, requestOtp, verifyOtp, loginWithPassword, signupWithPassword, loginWithGoogle, isCheckingExists, isRequestingOtp, isVerifyingOtp, isLoggingInWithPassword, isSigningUpWithPassword, isGoogleLoading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authType, setAuthType] = useState<"otp" | "password">("password");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  if (!isLoading && user) return <Redirect to={isOnboardingComplete(user) ? "/app" : "/onboarding"} />;

  const isBusy = isCheckingExists || isRequestingOtp || isVerifyingOtp || isLoggingInWithPassword || isSigningUpWithPassword || isGoogleLoading;

  async function startOtpFlow() {
    setError(null); setDeliveryInfo(null);
    const normalizedEmail = email.trim().toLowerCase();
    const existsResponse = await checkAuthExists(normalizedEmail);
    if (mode === "signin" && !existsResponse.exists) return setError(t.auth.errors.emailNotRegistered);
    if (mode === "signup" && existsResponse.exists) return setError(t.auth.errors.emailAlreadyRegistered);
    const result = await requestOtp(normalizedEmail);
    setDeliveryInfo(result.delivery.provider === "dev-console" ? t.auth.otpSentDev : t.auth.otpSent);
    setStep("code");
  }

  async function submitPasswordAuth() {
    setError(null);
    if (mode === "signup") {
      if (!strongPassword(password)) return setError(t.auth.errors.weakPassword);
      if (password !== confirmPassword) return setError(t.auth.errors.passwordMismatch);
      await signupWithPassword({ email: email.trim().toLowerCase(), password });
      return;
    }
    await loginWithPassword({ email: email.trim().toLowerCase(), password });
  }

  async function handleGoogleLogin() {
    const token = window.prompt("Cole aqui seu Google id_token (modo inicial)");
    if (!token) return;
    await loginWithGoogle({ idToken: token });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-4xl">🐾</div>
          <div>
            <CardTitle className="text-2xl font-display">{step === "email" ? t.auth.title : t.auth.codeStepTitle}</CardTitle>
            <CardDescription>{step === "email" ? t.auth.subtitle : t.auth.codeStepSubtitle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")}>{t.auth.signIn}</Button>
            <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>{t.auth.signUp}</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={authType === "password" ? "default" : "outline"} onClick={() => { setAuthType("password"); setStep("email"); }}>{t.auth.passwordAuth}</Button>
            <Button variant={authType === "otp" ? "default" : "outline"} onClick={() => { setAuthType("otp"); setStep("email"); }}>{t.auth.otpAuth}</Button>
          </div>

          <Input type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "code" || isBusy} />

          {authType === "password" && step === "email" && (
            <>
              <Input type="password" placeholder={t.auth.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isBusy} />
              {mode === "signup" && <Input type="password" placeholder={t.auth.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isBusy} />}
            </>
          )}
          {authType === "otp" && step === "code" && <Input inputMode="numeric" maxLength={6} placeholder={t.auth.codePlaceholder} value={code} onChange={(e) => setCode(e.target.value)} disabled={isBusy} />}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {deliveryInfo && <p className="text-sm text-muted-foreground">{deliveryInfo}</p>}

          {authType === "otp" ? (
            step === "email" ?
              <Button className="w-full h-12 text-lg" onClick={startOtpFlow} disabled={isBusy}>{isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{mode === "signin" ? t.auth.signIn : t.auth.signUp}</Button>
              : <>
                <Button className="w-full h-12 text-lg" onClick={() => verifyOtp({ email: email.trim().toLowerCase(), code }).catch((e) => setError(String(e.message || t.auth.errors.invalidCode)))} disabled={isBusy}>{isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.auth.verifyCode}</Button>
                <Button variant="ghost" onClick={() => { setStep("email"); setCode(""); setError(null); }}>{t.auth.back}</Button>
              </>
          ) : (
            <Button className="w-full h-12 text-lg" onClick={() => submitPasswordAuth().catch((e) => setError(String(e.message || t.auth.errors.generic)))} disabled={isBusy}>{isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{mode === "signin" ? t.auth.signIn : t.auth.signUp}</Button>
          )}

          <Button variant="outline" onClick={() => handleGoogleLogin().catch((e) => setError(String(e.message || t.auth.errors.generic)))} disabled={isBusy}>Continuar com Google</Button>
          <Button variant="outline" disabled>Continuar com Apple (em breve)</Button>
          <p className="text-xs text-center text-muted-foreground">{t.auth.policiesNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
