import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function AuthPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/app" />;
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-4xl">
            🐾
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Welcome to PetCrushes</CardTitle>
            <CardDescription>
              Join the community of pet lovers.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            className="w-full h-12 text-lg" 
            onClick={() => window.location.href = apiUrl("/api/login")}
          >
            Log in with Replit
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            By logging in, you agree to our strict no-sales policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
