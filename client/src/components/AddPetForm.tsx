import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePet } from "@/hooks/use-pets";
import { useLanguage } from "@/lib/i18n";
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { BLOCKED_KEYWORDS, type CreatePetRequest } from "@/lib/api-contract";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { BREEDS_BY_SPECIES, getSpeciesLabel, SPECIES_OPTIONS, type PetSpecies } from "@/lib/pet-taxonomy";

const formSchema = z.object({
  displayName: z.string().min(1, "Nome obrigatório / Name is required"),
  species: z.string().min(1, "Selecione a espécie / Select a species"),
  breed: z.string().min(1, "Informe a raça / Enter the breed"),
  useCustomBreed: z.boolean().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).nullable().optional(),
  colorsRaw: z.string().min(1, "Informe ao menos uma cor / Enter at least one color"),
  ageMonths: z.coerce.number().min(0, "Idade inválida / Invalid age"),
  pedigree: z.boolean(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  healthNotes: z.string().nullable().optional(),
  objective: z.enum(["BREEDING", "COMPANIONSHIP", "SOCIALIZATION"]),
  isDonation: z.boolean().optional(),
  country: z.string().min(1, "País obrigatório / Country is required"),
  state: z.string().min(1, "Estado obrigatório / State is required"),
  city: z.string().min(1, "Cidade obrigatória / City is required"),
  about: z.string().min(1, "Descreva seu pet / Describe your pet").refine((val) => !BLOCKED_KEYWORDS.some((keyword) => val.toLowerCase().includes(keyword)), {
    message: "Conteúdo de venda não é permitido / Sales content is not allowed.",
  }),
  photos: z.array(z.string()).min(3, "Envie ao menos 3 fotos / Please upload at least 3 photos"),
  videoUrl: z.string().url("Vídeo obrigatório / Video is required"),
});

type FormValues = z.infer<typeof formSchema>;

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch("/api/media/upload", { method: "POST", body: formData });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 503) {
      throw new Error("Upload indisponível no momento. Verifique a configuração e toque em Tentar novamente.");
    }
    throw new Error(payload?.error?.message ?? payload.message ?? "Não foi possível enviar o arquivo agora. / Could not upload right now.");
  }
  return response.json() as Promise<{ url: string; duration?: number }>;
}

export function AddPetForm({ onSuccess }: { onSuccess: () => void }) {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const createPet = useCreatePet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      species: "DOG",
      breed: "",
      useCustomBreed: false,
      gender: "MALE",
      size: "MEDIUM",
      colorsRaw: "",
      ageMonths: 0,
      pedigree: false,
      vaccinated: false,
      neutered: false,
      objective: "COMPANIONSHIP",
      isDonation: false,
      country: "",
      state: "",
      city: "",
      about: "",
      photos: [],
      videoUrl: "",
      healthNotes: "",
    },
  });

  const species = form.watch("species") as PetSpecies;
  const showSize = species === "DOG" || species === "CAT";
  const useCustomBreed = form.watch("useCustomBreed") ?? false;
  const availableBreeds = useMemo(() => BREEDS_BY_SPECIES[species] ?? ["Outro"], [species]);

  async function handlePhotosUpload(files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(uploadFile));
    form.setValue("photos", [...form.getValues("photos"), ...uploaded.map((item) => item.url)], { shouldValidate: true });
  }

  async function handleVideoUpload(file: File | null) {
    if (!file) return;
    const uploaded = await uploadFile(file);
    if ((uploaded.duration ?? 0) < 5) throw new Error("Vídeo deve ter no mínimo 5 segundos / Video must be at least 5 seconds");
    form.setValue("videoUrl", uploaded.url, { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const payload: CreatePetRequest = {
        displayName: data.displayName,
        species: data.species,
        breed: data.breed,
        gender: data.gender,
        size: showSize ? data.size ?? null : null,
        colors: data.colorsRaw.split(",").map((c) => c.trim()).filter(Boolean),
        ageMonths: data.ageMonths,
        pedigree: data.pedigree,
        vaccinated: data.vaccinated ?? false,
        neutered: data.neutered ?? false,
        healthNotes: data.healthNotes,
        objective: data.objective,
        isDonation: data.isDonation ?? false,
        region: `${data.country} / ${data.state} / ${data.city}`,
        about: data.about,
        photos: data.photos,
        videoUrl: data.videoUrl,
      };

      await createPet.mutateAsync(payload);
      toast({ title: "Success", description: "Pet registered successfully" });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>{t.forms.name}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="species" render={({ field }) => (<FormItem><FormLabel>{t.forms.species}</FormLabel><Select onValueChange={(value) => { field.onChange(value); form.setValue("breed", ""); form.setValue("useCustomBreed", false); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger></FormControl><SelectContent>{SPECIES_OPTIONS.map((s) => <SelectItem key={s} value={s}>{getSpeciesLabel(s, lang)}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="breed" render={({ field }) => (<FormItem><FormLabel>{t.forms.breed}</FormLabel><FormControl><Input {...field} list={`breeds-${species}`} placeholder={lang === "pt-BR" ? "Digite a raça" : "Type the breed"} disabled={useCustomBreed} /></FormControl><datalist id={`breeds-${species}`}>{availableBreeds.map((b) => <option key={b} value={b} />)}</datalist><FormMessage /></FormItem>)} />
        </div>

        <FormField control={form.control} name="useCustomBreed" render={({ field }) => (<FormItem className="flex gap-2 items-center"><Checkbox checked={field.value ?? false} onCheckedChange={(checked) => { field.onChange(checked === true); if (checked === true) form.setValue("breed", ""); }} /><FormLabel>{lang === "pt-BR" ? "Não encontrei / Outro" : "I couldn't find it / Other"}</FormLabel></FormItem>)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="ageMonths" render={({ field }) => (<FormItem><FormLabel>{t.forms.age}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>{t.forms.gender}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>

        {showSize && <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Porte / Size</FormLabel><Select onValueChange={(value) => field.onChange(value)} value={field.value ?? "MEDIUM"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="SMALL">Small</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="LARGE">Large</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />}

        <FormField control={form.control} name="colorsRaw" render={({ field }) => (<FormItem><FormLabel>Cores (separadas por vírgula) / Colors (comma separated)</FormLabel><FormControl><Input placeholder="Preto, Branco" {...field} /></FormControl><FormMessage /></FormItem>)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <FormField control={form.control} name="about" render={({ field }) => (<FormItem><FormLabel>{t.forms.about}</FormLabel><FormControl><Textarea className="resize-none h-32" {...field} /></FormControl><div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" />{t.common.sales_warning}</div><FormMessage /></FormItem>)} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField control={form.control} name="pedigree" render={({ field }) => (<FormItem className="flex gap-2 items-center"><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /><FormLabel>Pedigree</FormLabel></FormItem>)} />
          <FormField control={form.control} name="vaccinated" render={({ field }) => (<FormItem className="flex gap-2 items-center"><Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} /><FormLabel>Vacinado</FormLabel></FormItem>)} />
          <FormField control={form.control} name="neutered" render={({ field }) => (<FormItem className="flex gap-2 items-center"><Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} /><FormLabel>Castrado</FormLabel></FormItem>)} />
          <FormField control={form.control} name="isDonation" render={({ field }) => (<FormItem className="flex gap-2 items-center"><Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} /><FormLabel>Adoption</FormLabel></FormItem>)} />
        </div>

        <div className="space-y-2"><FormLabel>{t.forms.photos} (mín. 3)</FormLabel><Input type="file" accept="image/*" multiple onChange={(e) => handlePhotosUpload(e.target.files).catch((err) => toast({ title: "Erro", description: `${err.message} Tente novamente.`, variant: "destructive" }))} /><p className="text-xs text-muted-foreground">{form.watch("photos").length} fotos enviadas</p></div>
        <div className="space-y-2"><FormLabel>Vídeo obrigatório (mínimo 5s) / Required video (min 5s)</FormLabel><Input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files?.[0] ?? null).catch((err) => toast({ title: "Erro", description: `${err.message} Tente novamente.`, variant: "destructive" }))} /><p className="text-xs text-muted-foreground">{form.watch("videoUrl") ? "Vídeo enviado" : "Nenhum vídeo enviado"}</p></div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isSubmitting}><Upload className="mr-2 h-4 w-4" />{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}{t.forms.submit_pet}</Button>
      </form>
    </Form>
  );
}
