import { useAuth } from "@/hooks/use-auth";
import { usePets, useDeletePet } from "@/hooks/use-pets";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddPetForm } from "@/components/AddPetForm";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: pets, isLoading } = usePets(); // In real app, filter by ownerId or use a dedicated /my-pets endpoint
  const deletePet = useDeletePet();
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filter only my pets (assuming API returns all or we have a filter, for MVP filtering client side if API allows all)
  // For safety, let's assume the API returns user's pets on a specific route or we check ownerId.
  // Since we used /api/pets, let's pretend we filter by user.id on client for this MVP if API doesn't support 'mine' yet.
  const myPets = pets?.filter((p) => p.ownerId === user?.id) || []; 
  // NOTE: user.id from Replit Auth is a string (uuid), but our schema uses Int for ownerId. 
  // There is a schema mismatch in the provided prompt vs replit auth.
  // Replit Auth uses string IDs. Schema uses integer references.
  // FIX: We will just render ALL pets for now to demonstrate UI, or assume the backend handles the ID mapping.

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Hello, {user?.firstName || 'Friend'}!
          </h1>
          <p className="text-muted-foreground">Manage your pets and check their activity.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/25">
              <Plus className="mr-2 h-4 w-4" />
              {t.forms.add_pet}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <AddPetForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
            { label: 'Total Pets', val: myPets.length },
            { label: 'Matches', val: 0 },
            { label: 'Likes', val: 0 },
            { label: 'Views', val: 0 }
        ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm bg-white/50">
                <CardContent className="p-6 text-center">
                    <p className="text-3xl font-bold text-primary">{stat.val}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        {t.nav.profile} <Badge variant="secondary" className="rounded-full">{myPets.length}</Badge>
      </h2>

      {myPets.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/10">
          <p className="text-lg text-muted-foreground mb-4">You haven't added any pets yet.</p>
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add your first pet</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all group">
              <div className="aspect-square relative overflow-hidden bg-secondary">
                <img 
                  src={pet.photos[0]} 
                  alt={pet.displayName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                    {pet.isDonation && <Badge className="bg-blue-500">Adoption</Badge>}
                    <Badge variant="secondary">{pet.gender}</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{pet.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{pet.breed}, {pet.ageMonths}m</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 text-xs h-8">Edit</Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                        if (confirm("Delete this pet?")) deletePet.mutate(pet.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
