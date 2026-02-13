import { useState } from "react";
import { useAdoptions, useCreateAdoption } from "@/hooks/use-pets";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BREEDS_BY_SPECIES, getSpeciesLabel, SPECIES_OPTIONS, type PetSpecies } from "@/lib/pet-taxonomy";
import { apiFetch } from "@/lib/api";

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch("/api/media/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("Upload failed");
  return response.json() as Promise<{ url: string }>;
}

export default function AdoptionFeed() {
  const { t, lang } = useLanguage();
  const { data } = useAdoptions();
  const create = useCreateAdoption();
  const [open, setOpen] = useState(false);
  const [species, setSpecies] = useState<PetSpecies>("DOG");
  const [form, setForm] = useState({ name: "", breed: "", ageLabel: "", country: "", state: "", city: "", pedigree: false, neutered: false, description: "", contact: "", status: "DISPONIVEL" as const, photos: [] as string[] });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-3xl font-display font-bold">Adoções</h1>
      <p className="text-muted-foreground">A adoção é combinada fora do app. O PetCrushes apenas divulga.</p>
      <Button onClick={() => setOpen((v) => !v)}>Registrar doação</Button>

      {open && (
        <Card><CardContent className="p-4 space-y-3">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="w-full border rounded-md h-10 px-3" value={species} onChange={(e) => { setSpecies(e.target.value as PetSpecies); setForm({ ...form, breed: "" }); }}>
            {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{getSpeciesLabel(s, lang)}</option>)}
          </select>
          <Input placeholder="Raça" list={`adopt-breeds-${species}`} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <datalist id={`adopt-breeds-${species}`}>{(BREEDS_BY_SPECIES[species] ?? []).map((b) => <option key={b} value={b} />)}</datalist>
          <Input placeholder="Idade (ex: 2 anos)" value={form.ageLabel} onChange={(e) => setForm({ ...form, ageLabel: e.target.value })} />
          <div className="grid grid-cols-3 gap-2"><Input placeholder="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /><Input placeholder="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /><Input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <Textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="WhatsApp/telefone" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <div className="flex gap-4"><label className="flex items-center gap-2"><Checkbox checked={form.pedigree} onCheckedChange={(v) => setForm({ ...form, pedigree: v === true })} />Pedigree</label><label className="flex items-center gap-2"><Checkbox checked={form.neutered} onCheckedChange={(v) => setForm({ ...form, neutered: v === true })} />Castrado</label></div>
          <Input type="file" accept="image/*" multiple onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            const uploaded = await Promise.all(files.map(uploadFile));
            setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded.map((u) => u.url)] }));
          }} />
          <Button disabled={create.isPending || form.photos.length < 3} onClick={() => create.mutate({ ...form, species, breed: form.breed || "Outro" })}>Publicar</Button>
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data?.items ?? []).map((post: any) => (
          <Card key={post.id}>
            <img src={post.photos[0]} className="w-full h-48 object-cover" />
            <CardContent className="p-4 space-y-1">
              <h3 className="font-bold text-xl">{post.name}</h3>
              <p className="text-sm">{post.species} • {post.breed}</p>
              <p className="text-sm text-muted-foreground">{post.city}/{post.state}</p>
              <p className="text-sm">{post.description}</p>
              <p className="font-semibold">Contato: {post.contact}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
