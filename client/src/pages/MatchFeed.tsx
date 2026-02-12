import { useMemo, useState } from "react";
import { useFeed, useMyDefaultPet } from "@/hooks/use-pets";
import { useLikePet } from "@/hooks/use-interactions";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Heart, MapPin, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

type Filters = {
  species?: string;
  gender?: string;
  objective?: string;
  region?: string;
  size?: string;
};

export default function MatchFeed() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const { data: myPet, isLoading: isLoadingMyPet } = useMyDefaultPet();
  const { data: feed, isLoading } = useFeed({ ...filters, page, limit: 10 });
  const likeMutation = useLikePet();

  const pets = feed?.items ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPet = useMemo(() => pets[currentIndex], [pets, currentIndex]);

  if (isLoading || isLoadingMyPet) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!myPet) {
    return (
      <div className="h-full max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Você ainda não cadastrou um pet. Cadastre para começar.</h2>
        <p className="text-muted-foreground mb-6">You still don't have a registered pet. Add one to start matching.</p>
        <Link href="/app">
          <Button>Ir para meus pets</Button>
        </Link>
      </div>
    );
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentPet) return;

    if (direction === 'right') {
      likeMutation.mutate({ likerPetId: myPet.id, targetPetId: currentPet.id });
    }

    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  return (
    <div className="h-full max-w-lg mx-auto flex flex-col p-4 md:p-6">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, species: val === 'ALL' ? undefined : val })); setPage(1); setCurrentIndex(0); }}>
          <SelectTrigger className="w-[120px] rounded-full bg-white border-none shadow-sm"><SelectValue placeholder={t.match.species} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="DOG">Dog</SelectItem>
            <SelectItem value="CAT">Cat</SelectItem>
            <SelectItem value="BIRD">Bird</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => { setFilters((prev) => ({ ...prev, objective: val === 'ALL' ? undefined : val })); setPage(1); setCurrentIndex(0); }}>
          <SelectTrigger className="w-[140px] rounded-full bg-white border-none shadow-sm"><SelectValue placeholder={t.match.objective} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="COMPANIONSHIP">Friends</SelectItem>
            <SelectItem value="BREEDING">Date</SelectItem>
            <SelectItem value="SOCIALIZATION">Social</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="popLayout">
          {currentPet ? (
            <motion.div key={currentPet.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.05, opacity: 0, x: 200 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="absolute inset-0">
              <Card className="h-full overflow-hidden border-none shadow-2xl rounded-3xl bg-white relative group">
                <div className="absolute inset-0">
                  <img src={currentPet.photos[0]} alt={currentPet.displayName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-end gap-2 mb-2">
                    <h2 className="text-4xl font-display font-bold">{currentPet.displayName}</h2>
                    <span className="text-xl font-medium opacity-90 mb-1">{currentPet.ageMonths}m</span>
                  </div>
                  <p className="text-lg opacity-90 mb-4">{currentPet.breed} • {currentPet.gender === 'MALE' ? '♂' : '♀'}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">{currentPet.objective}</Badge>
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-1"><MapPin size={12} /> {currentPet.region}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm opacity-80 mb-6">{currentPet.about}</p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4"><span className="text-4xl">😴</span></div>
              <h3 className="text-xl font-bold mb-2">{t.match.empty}</h3>
              <p className="text-muted-foreground">Try changing your filters, or go to next page.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {currentPet && (
        <div className="h-24 flex items-center justify-center gap-6 mt-6">
          <Button size="lg" variant="outline" className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive shadow-lg hover:scale-110 transition-transform" onClick={() => handleSwipe('left')}>
            <X size={32} />
          </Button>
          <Button size="lg" variant="ghost" className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"><Info size={24} /></Button>
          <Button size="lg" className="h-16 w-16 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 border-none shadow-lg shadow-green-500/30 hover:scale-110 transition-transform" onClick={() => handleSwipe('right')}>
            <Heart size={32} fill="white" className="text-white" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => { setPage((p) => Math.max(1, p - 1)); setCurrentIndex(0); }} disabled={page === 1}>Anterior</Button>
        <p className="text-sm text-muted-foreground">Página {page}</p>
        <Button variant="outline" onClick={() => { setPage((p) => p + 1); setCurrentIndex(0); }} disabled={!feed?.hasMore}>Próxima</Button>
      </div>
    </div>
  );
}
