import { usePets } from "@/hooks/use-pets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { Loader2, Heart, ExternalLink } from "lucide-react";

export default function AdoptionFeed() {
  const { t } = useLanguage();
  // Filter for donations
  const { data: pets, isLoading } = usePets({ isDonation: true });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-display font-bold text-primary">{t.donate.title}</h1>
        <p className="text-xl text-muted-foreground">{t.donate.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pets?.map((pet) => (
          <Card key={pet.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white flex flex-col">
            <div className="aspect-[4/5] relative overflow-hidden bg-muted">
              <img 
                src={pet.photos[0]} 
                alt={pet.displayName} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3">
                 <Badge className="bg-white/90 text-primary hover:bg-white shadow-sm backdrop-blur-sm">
                    {pet.ageMonths} months
                 </Badge>
              </div>
            </div>
            
            <CardContent className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl font-display">{pet.displayName}</h3>
                    {pet.gender === 'MALE' ? <span className="text-blue-500 font-bold">♂</span> : <span className="text-pink-500 font-bold">♀</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pet.about}</p>
                
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{pet.breed}</Badge>
                    <Badge variant="secondary">{pet.region}</Badge>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button className="w-full rounded-full gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    <Heart size={16} className="fill-current" />
                    {t.donate.adopt}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
