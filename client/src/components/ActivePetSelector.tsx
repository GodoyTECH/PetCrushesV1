import { useMyDefaultPet, useMyPets, useSetMyActivePet } from "@/hooks/use-pets";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";

export function ActivePetSelector() {
  const { t } = useLanguage();
  const { data: myPets = [] } = useMyPets();
  const { data: activePet } = useMyDefaultPet();
  const setActivePet = useSetMyActivePet();

  if (myPets.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <Label>{t.match.activePetLabel}</Label>
      <Select value={activePet ? String(activePet.id) : undefined} onValueChange={(petId) => setActivePet.mutate({ petId: Number(petId) })}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={t.match.selectActivePet} />
        </SelectTrigger>
        <SelectContent>
          {myPets.map((pet) => (
            <SelectItem key={pet.id} value={String(pet.id)}>
              {pet.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
