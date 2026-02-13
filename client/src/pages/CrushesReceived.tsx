import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { formatAgeMonths, formatPetLocation } from "@/lib/pet-format";

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";

export default function CrushesReceived() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/likes/received"],
    queryFn: async () => {
      const res = await apiFetch("/api/likes/received");
      if (!res.ok) throw new Error("Não foi possível carregar Deu Crush agora. / Could not load Deu Crush right now.");
      return res.json() as Promise<{ items: Array<any> }>;
    },
  });

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const items = data?.items ?? [];

  if (!items.length) {
    return <div className="max-w-2xl mx-auto p-6 text-center text-muted-foreground">Ainda não houve Deu Crush por aqui. Continue em Crushes e Amigos para aumentar sua visibilidade.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-3">
      <h1 className="text-2xl font-bold">Deu Crush</h1>
      {items.map((item) => (
        <Card key={item.likeId} className="p-3 flex items-center gap-3">
          <img src={item.pet.photos?.[0] || FALLBACK_PHOTO} className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{item.pet.displayName} • {formatAgeMonths(item.pet.ageMonths)}</p>
            <p className="text-sm text-muted-foreground truncate">{formatPetLocation(item.pet)}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary">{item.pet.vaccinated ? "Vacinado" : "Não vacinado"}</Badge>
              <Badge variant="secondary">{item.pet.pedigree ? "Pedigree" : "Sem pedigree"}</Badge>
              <Badge variant="secondary">{item.pet.trained ? "Adestrado" : "Sem adestramento"}</Badge>
              <Badge variant="secondary">{item.pet.neutered ? "Castrado" : "Não castrado"}</Badge>
            </div>
          </div>
          {item.isMutual ? (
            <Button onClick={() => setLocation("/app/chat")}>Conversar</Button>
          ) : (
            <Button variant="outline">Ver perfil</Button>
          )}
        </Card>
      ))}
    </div>
  );
}
