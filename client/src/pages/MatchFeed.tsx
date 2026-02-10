import { useState } from "react";
import { usePets } from "@/hooks/use-pets";
import { useLikePet } from "@/hooks/use-interactions";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Heart, MapPin, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

// Basic filters state
type Filters = {
    species?: string;
    objective?: string;
}

export default function MatchFeed() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [filters, setFilters] = useState<Filters>({});
    const { data: pets, isLoading } = usePets(filters);
    const likeMutation = useLikePet();
    
    // Simple index-based stack for MVP. 
    // In production, we'd remove items from the query cache or maintain a robust list.
    const [currentIndex, setCurrentIndex] = useState(0);

    // Assuming first pet is the "active" user pet for now.
    // In real app, user selects which of their pets is "browsing".
    // For this demo, we'll just use a mock ID or fetch user pets and pick one.
    const myPetId = 1; 

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const currentPet = pets?.[currentIndex];

    const handleSwipe = (direction: 'left' | 'right') => {
        if (!currentPet) return;
        
        if (direction === 'right') {
            likeMutation.mutate({ likerPetId: myPetId, targetPetId: currentPet.id });
        }
        
        setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    };

    return (
        <div className="h-full max-w-lg mx-auto flex flex-col p-4 md:p-6">
            {/* Filters Header */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <Select onValueChange={(val) => setFilters(prev => ({...prev, species: val === 'ALL' ? undefined : val}))}>
                    <SelectTrigger className="w-[120px] rounded-full bg-white border-none shadow-sm">
                        <SelectValue placeholder={t.match.species} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="DOG">Dog</SelectItem>
                        <SelectItem value="CAT">Cat</SelectItem>
                    </SelectContent>
                </Select>
                
                <Select onValueChange={(val) => setFilters(prev => ({...prev, objective: val === 'ALL' ? undefined : val}))}>
                    <SelectTrigger className="w-[140px] rounded-full bg-white border-none shadow-sm">
                        <SelectValue placeholder={t.match.objective} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="COMPANIONSHIP">Friends</SelectItem>
                        <SelectItem value="BREEDING">Date</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Card Stack */}
            <div className="flex-1 relative">
                <AnimatePresence mode="popLayout">
                    {currentPet ? (
                        <motion.div
                            key={currentPet.id}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.05, opacity: 0, x: 200 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="absolute inset-0"
                        >
                            <Card className="h-full overflow-hidden border-none shadow-2xl rounded-3xl bg-white relative group">
                                <div className="absolute inset-0">
                                    <img 
                                        src={currentPet.photos[0]} 
                                        alt={currentPet.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                    <div className="flex items-end gap-2 mb-2">
                                        <h2 className="text-4xl font-display font-bold">{currentPet.displayName}</h2>
                                        <span className="text-xl font-medium opacity-90 mb-1">{currentPet.ageMonths}m</span>
                                    </div>
                                    <p className="text-lg opacity-90 mb-4">{currentPet.breed} • {currentPet.gender === 'MALE' ? '♂' : '♀'}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">
                                            {currentPet.objective}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-1">
                                            <MapPin size={12} /> {currentPet.region}
                                        </Badge>
                                    </div>

                                    <p className="line-clamp-2 text-sm opacity-80 mb-6">{currentPet.about}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <span className="text-4xl">😴</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.match.empty}</h3>
                            <p className="text-muted-foreground">Try changing your filters or come back later.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons */}
            {currentPet && (
                <div className="h-24 flex items-center justify-center gap-6 mt-6">
                    <Button 
                        size="lg" 
                        variant="outline"
                        className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive shadow-lg hover:scale-110 transition-transform"
                        onClick={() => handleSwipe('left')}
                    >
                        <X size={32} />
                    </Button>
                    
                    <Button 
                        size="lg" 
                        variant="ghost"
                        className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                        <Info size={24} />
                    </Button>

                    <Button 
                        size="lg" 
                        className="h-16 w-16 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 border-none shadow-lg shadow-green-500/30 hover:scale-110 transition-transform"
                        onClick={() => handleSwipe('right')}
                    >
                        <Heart size={32} fill="white" className="text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
}
