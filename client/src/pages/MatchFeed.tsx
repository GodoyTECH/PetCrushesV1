import { useMemo, useState } from "react";
import { useFeed, useMyDefaultPet } from "@/hooks/use-pets";
import { useLikePet } from "@/hooks/use-interactions";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Heart, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ActivePetSelector } from "@/components/ActivePetSelector";
import { useToast } from "@/hooks/use-toast";
import { formatAgeMonths, formatPetLocation } from "@/lib/pet-format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACTION_ICON_PATHS = {
  skip: "/assets/btn_x.png",
  crush: "/assets/btn_crush.png",
  friend: "/assets/btn_friend.png",
} as const;

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";

type Filters = {
  species?: string;
  gender?: string;
  objective?: string;
  region?: string;
  size?: string;
};

function compatibility(myPet: any, target: any) {
  if (!myPet || !target) return { score: 0, label: "Baixa", reasons: [] as string[] };
  let score = 0;
  const reasons: string[] = [];
  if (myPet.species === target.species) { score += 25; reasons.push("Mesma espécie"); }
  if (myPet.breed === target.breed) { score += 15; reasons.push("Raça compatível"); }
  if (myPet.objective === target.objective) { score += 15; reasons.push("Objetivos alinhados"); }
  if (myPet.city && target.city && myPet.city === target.city) { score += 15; reasons.push("Mesma cidade"); }
  else if (myPet.state && target.state && myPet.state === target.state) { score += 10; reasons.push("Mesmo estado"); }
  if (myPet.vaccinated && target.vaccinated) { score += 10; reasons.push("Ambos vacinados"); }
  if (myPet.trained && target.trained) { score += 5; reasons.push("Ambos adestrados"); }
  if (myPet.pedigree === target.pedigree) { score += 5; reasons.push(myPet.pedigree ? "Ambos pedigree" : "Sem pedigree em ambos"); }
  const label = score >= 70 ? "Alta" : score >= 40 ? "Média" : "Baixa";
  return { score, label, reasons };
}

export default function MatchFeed() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [mode, setMode] = useState<"crushes" | "friends">("crushes");
  const [page, setPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [actionAssetReady, setActionAssetReady] = useState({ skip: true, crush: true, friend: true });
  const { data: myPet, isLoading: isLoadingMyPet } = useMyDefaultPet();
  const { data: feed, isLoading } = useFeed({ ...filters, mode, page, limit: 10 });
  const likeMutation = useLikePet();

  const pets = feed?.items ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPet = useMemo(() => pets[currentIndex], [pets, currentIndex]);
  const comp = useMemo(() => compatibility(myPet, currentPet), [myPet, currentPet]);

  if (isLoading || isLoadingMyPet) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!myPet) {
    return (
      <div className="h-full max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">{t.match.needActivePetTitle}</h2>
        <p className="text-muted-foreground mb-6">{t.match.needActivePetDescription}</p>
        <Link href="/app"><Button>{t.match.goToMyPets}</Button></Link>
      </div>
    );
  }

  const handleLike = () => {
    if (!currentPet) return;
    likeMutation.mutate({ likerPetId: myPet.id, targetPetId: currentPet.id }, {
      onSuccess: (result) => { if (result.matched) toast({ title: "Deu Crush!", description: "Crush recíproco. Conversa liberada." }); },
      onError: (error) => toast({ title: t.common.error, description: error.message, variant: "destructive" }),
    });
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const handleSkip = () => setCurrentIndex((prev) => prev + 1);

  return (
    <div className="h-full max-w-lg mx-auto flex flex-col p-3 md:p-6">
      <div className="mb-3"><ActivePetSelector /></div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button variant={mode === "crushes" ? "default" : "outline"} onClick={() => { setMode("crushes"); setCurrentIndex(0); }}>Crushes</Button>
        <Button variant={mode === "friends" ? "default" : "outline"} onClick={() => { setMode("friends"); setCurrentIndex(0); }}>Amigos</Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, species: val === "ALL" ? undefined : val })); setCurrentIndex(0); }}><SelectTrigger className="w-[120px]"><SelectValue placeholder={t.match.species} /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="DOG">Cachorro</SelectItem><SelectItem value="CAT">Gato</SelectItem><SelectItem value="BIRD">Ave</SelectItem><SelectItem value="OTHER">Outro</SelectItem></SelectContent></Select>
        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, gender: val === "ALL" ? undefined : val })); setCurrentIndex(0); }}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Gênero" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="MALE">Macho</SelectItem><SelectItem value="FEMALE">Fêmea</SelectItem></SelectContent></Select>
        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, objective: val === "ALL" ? undefined : val })); setCurrentIndex(0); }}><SelectTrigger className="w-[140px]"><SelectValue placeholder={t.match.objective} /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="COMPANIONSHIP">Amizade</SelectItem><SelectItem value="BREEDING">Crushes</SelectItem><SelectItem value="SOCIALIZATION">Socialização</SelectItem></SelectContent></Select>
        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, size: val === "ALL" ? undefined : val })); setCurrentIndex(0); }}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Porte" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="SMALL">Pequeno</SelectItem><SelectItem value="MEDIUM">Médio</SelectItem><SelectItem value="LARGE">Grande</SelectItem></SelectContent></Select>
      </div>
      <Input placeholder="Região (cidade/estado)" value={filters.region ?? ""} onChange={(e) => { setFilters((prev) => ({ ...prev, region: e.target.value || undefined })); setCurrentIndex(0); }} className="mb-4" />

      <div className="flex-1 relative min-h-[520px]">
        <AnimatePresence mode="popLayout">
          {currentPet ? (
            <motion.div key={currentPet.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.05, opacity: 0, x: 200 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="absolute inset-0">
              <Card className="h-full overflow-hidden border-none shadow-2xl rounded-3xl bg-white relative group">
                <img src={currentPet.photos?.[0] || FALLBACK_PHOTO} alt={currentPet.displayName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-3">
                  <h2 className="text-3xl font-display font-bold">{currentPet.displayName} • {formatAgeMonths(currentPet.ageMonths)}</h2>
                  <p className="text-sm opacity-90 flex items-center gap-1"><MapPin size={14} /> {formatPetLocation(currentPet)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">{currentPet.vaccinated ? "Vacinado" : "Não vacinado"}</Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">{currentPet.pedigree ? "Pedigree" : "Sem pedigree"}</Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">{currentPet.trained ? "Adestrado" : "Sem adestramento"}</Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">{currentPet.neutered ? "Castrado" : "Não castrado"}</Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">{currentPet.objective || currentPet.size}</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10"><h3 className="text-xl font-bold">{t.match.empty}</h3></div>
          )}
        </AnimatePresence>
      </div>

      {currentPet && (
        <div className="h-24 flex items-center justify-center gap-4 mt-4">
          <Button size="lg" variant="outline" className="h-16 w-16 rounded-full" onClick={handleSkip}>{actionAssetReady.skip ? <img src={ACTION_ICON_PATHS.skip} onError={() => setActionAssetReady((p) => ({ ...p, skip: false }))} className="h-8 w-8" /> : <X size={20} />}<span className="sr-only">Pular</span></Button>
          <Button size="lg" variant="ghost" className="h-12 px-4 rounded-full" onClick={() => setShowDetails(true)}><Sparkles size={18} className="mr-1" />Crush perfeito</Button>
          <Button size="lg" className="h-16 w-24 rounded-full" onClick={handleLike}>{mode === "friends" ? (actionAssetReady.friend ? <img src={ACTION_ICON_PATHS.friend} onError={() => setActionAssetReady((p) => ({ ...p, friend: false }))} className="h-8 w-8" /> : <Heart size={18} />) : (actionAssetReady.crush ? <img src={ACTION_ICON_PATHS.crush} onError={() => setActionAssetReady((p) => ({ ...p, crush: false }))} className="h-8 w-8" /> : <Heart size={18} />)}<span className="text-xs ml-2">{mode === "friends" ? "Amizade" : "Crush"}</span></Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => { setPage((p) => Math.max(1, p - 1)); setCurrentIndex(0); }} disabled={page === 1}>Anterior</Button>
        <p className="text-sm text-muted-foreground">Página {page}</p>
        <Button variant="outline" onClick={() => { setPage((p) => p + 1); setCurrentIndex(0); }} disabled={!feed?.hasMore}>Próxima</Button>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crush perfeito</DialogTitle></DialogHeader>
          <p className="text-sm">Compatibilidade: <strong>{comp.label}</strong> ({comp.score}%)</p>
          <ul className="list-disc pl-5 text-sm space-y-1">{comp.reasons.map((item) => <li key={item}>{item}</li>)}</ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
