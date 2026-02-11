import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, requestOtp, verifyOtp, isRequestingOtp, isVerifyingOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (user) return <Redirect to="/app" />;

  async function onRequestOtp() {
    setError(null);
    try {
      const result = await requestOtp(email);
      setDeliveryInfo(
        result.delivery.provider === "dev-console"
          ? "Código enviado via dev-console. Veja o log do servidor (Render Logs)."
          : "Código enviado por e-mail.",
      );
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar código");
    }
  }

  async function onVerifyOtp() {
    setError(null);
    try {
      await verifyOtp({ email, code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao validar código");
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-4xl">🐾</div>
          <div>
            <CardTitle className="text-2xl font-display">Welcome to PetCrushes</CardTitle>
            <CardDescription>{step === "email" ? "Digite seu e-mail para receber um código." : "Digite o código de 6 dígitos."}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "code"} />
          {step === "code" && <Input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {deliveryInfo && <p className="text-sm text-muted-foreground">{deliveryInfo}</p>}

          {step === "email" ? (
            <Button className="w-full h-12 text-lg" onClick={onRequestOtp} disabled={isRequestingOtp}>
              {isRequestingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar código
            </Button>
          ) : (
            <Button className="w-full h-12 text-lg" onClick={onVerifyOtp} disabled={isVerifyingOtp}>
              {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">By logging in, you agree to our strict no-sales policy.</p>
        </CardContent>
      </Card>
    </div>
  );
}
