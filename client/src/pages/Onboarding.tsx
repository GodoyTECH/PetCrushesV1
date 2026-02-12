import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Onboarding em preparação</CardTitle>
          <CardDescription>
            Seu cadastro foi validado. Na próxima etapa, você preencherá seu perfil completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation("/app")}>Ir para o app</Button>
        </CardContent>
      </Card>
    </div>
  );
}
