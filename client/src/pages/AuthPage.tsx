import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useLanguage, type AppTranslations } from "@/lib/i18n";

type AuthMode = "signin" | "signup";

function isOnboardingComplete(user: any) {
  if (!user) return false;
  if (typeof user.onboardingCompleted === "boolean") return user.onboardingCompleted;
  return Boolean(user.displayName && user.whatsapp && user.region);
}

function getHumanErrorMessage(codeOrMessage: string, t: AppTranslations) {
  const code = codeOrMessage?.trim();
  if (!code) return t.auth.errors.generic;

  const byCode: Record<string, string> = {
    INVALID_EMAIL: t.auth.errors.invalidEmail,
    INVALID_PAYLOAD: t.auth.errors.invalidEmail,
    OTP_REQUEST_FAILED: t.auth.errors.requestFailed,
    OTP_INVALID_OR_EXPIRED: t.auth.errors.invalidCode,
  };

  return byCode[code] ?? codeOrMessage;
}

export default function AuthPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isLoading, checkAuthExists, requestOtp, verifyOtp, isCheckingExists, isRequestingOtp, isVerifyingOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (user) return <Redirect to={isOnboardingComplete(user) ? "/app" : "/onboarding"} />;

  async function startOtpFlow() {
    setError(null);
    setDeliveryInfo(null);

    try {
      const existsResult = await checkAuthExists(email);
      if (mode === "signin" && !existsResult.exists) {
        setError(t.auth.errors.emailNotRegistered);
        return;
      }
      if (mode === "signup" && existsResult.exists) {
        setError(t.auth.errors.emailAlreadyRegistered);
        return;
      }

      const result = await requestOtp(email);
      setDeliveryInfo(result.delivery.provider === "dev-console" ? t.auth.otpSentDev : t.auth.otpSent);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? getHumanErrorMessage(err.message, t) : t.auth.errors.requestFailed);
    }
  }

  async function onVerifyOtp() {
    setError(null);
    try {
      const result = await verifyOtp({ email, code });
      const shouldGoOnboarding = result.isNewUser || !isOnboardingComplete(result.user);
      setLocation(shouldGoOnboarding ? "/onboarding" : "/app");
    } catch (err) {
      setError(err instanceof Error ? getHumanErrorMessage(err.message, t) : t.auth.errors.invalidCode);
    }
  }

  const isBusy = isCheckingExists || isRequestingOtp || isVerifyingOtp;

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
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
          {step === "email" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")}>
                {t.auth.signIn}
              </Button>
              <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>
                {t.auth.signUp}
              </Button>
            </div>
          )}

          <Input type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "code" || isBusy} />
          {step === "code" && <Input inputMode="numeric" maxLength={6} placeholder={t.auth.codePlaceholder} value={code} onChange={(e) => setCode(e.target.value)} disabled={isBusy} />}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {deliveryInfo && <p className="text-sm text-muted-foreground">{deliveryInfo}</p>}

          {step === "email" ? (
            <Button className="w-full h-12 text-lg" onClick={startOtpFlow} disabled={isBusy}>
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "signin" ? t.auth.signIn : t.auth.signUp}
            </Button>
          ) : (
            <>
              <Button className="w-full h-12 text-lg" onClick={onVerifyOtp} disabled={isBusy}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t.auth.verifyCode}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
              >
                {t.auth.back}
              </Button>
            </>
          )}

          {step === "email" && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {mode === "signin" ? t.auth.createAccountHint : t.auth.signInHint}
            </p>
          )}
          <p className="text-xs text-center text-muted-foreground">{t.auth.policiesNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
