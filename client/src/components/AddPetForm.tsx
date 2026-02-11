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
import { BLOCKED_KEYWORDS } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { insertPetSchema } from "@shared/schema";
import { apiFetch } from "@/lib/api";

const formSchema = insertPetSchema.extend({
  photos: z.array(z.string()).min(3, "Mínimo de 3 fotos"),
  videoUrl: z.string().url("Vídeo obrigatório"),
  ageMonths: z.coerce.number().min(0),
  about: z.string().refine((val) => !BLOCKED_KEYWORDS.some((keyword) => val.toLowerCase().includes(keyword)), {
    message: "Sales content detected. This platform is for mating and adoption only.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch("/api/media/upload", { method: "POST", body: formData });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "Falha no upload");
  }
  return response.json() as Promise<{ url: string; duration?: number }>;
}

export function AddPetForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const createPet = useCreatePet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      species: "DOG",
      breed: "",
      gender: "MALE",
      size: "MEDIUM",
      colors: [],
      ageMonths: 0,
      pedigree: false,
      vaccinated: false,
      neutered: false,
      objective: "COMPANIONSHIP",
      isDonation: false,
      region: "",
      about: "",
      photos: [],
      videoUrl: "",
      healthNotes: "",
    },
  });

  async function handlePhotosUpload(files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(uploadFile));
    form.setValue("photos", [...form.getValues("photos"), ...uploaded.map((item) => item.url)], { shouldValidate: true });
  }

  async function handleVideoUpload(file: File | null) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("Não foi possível ler o vídeo"));
      video.src = previewUrl;
    }).finally(() => URL.revokeObjectURL(previewUrl));

    if (duration < 5) throw new Error("Vídeo deve ter pelo menos 5 segundos");

    const uploaded = await uploadFile(file);
    form.setValue("videoUrl", uploaded.url, { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      await createPet.mutateAsync(data);
      toast({ title: "Success!", description: "Pet registered successfully." });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>{t.forms.name}</FormLabel><FormControl><Input placeholder="Rex" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="species" render={({ field }) => (<FormItem><FormLabel>{t.forms.species}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger></FormControl><SelectContent><SelectItem value="DOG">Dog</SelectItem><SelectItem value="CAT">Cat</SelectItem><SelectItem value="BIRD">Bird</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="breed" render={({ field }) => (<FormItem><FormLabel>{t.forms.breed}</FormLabel><FormControl><Input placeholder="Golden Retriever" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="ageMonths" render={({ field }) => (<FormItem><FormLabel>{t.forms.age}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>{t.forms.gender}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>

        <FormField control={form.control} name="about" render={({ field }) => (<FormItem><FormLabel>{t.forms.about}</FormLabel><FormControl><Textarea placeholder="Tell us about your pet..." className="resize-none h-32" {...field} /></FormControl><div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" />{t.common.sales_warning}</div><FormMessage /></FormItem>)} />

        <FormField control={form.control} name="isDonation" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Available for Adoption</FormLabel></div></FormItem>)} />

        <div className="space-y-2">
          <FormLabel>{t.forms.photos} (mín. 3)</FormLabel>
          <Input type="file" accept="image/*" multiple onChange={(e) => handlePhotosUpload(e.target.files).catch((err) => toast({ title: "Erro", description: err.message, variant: "destructive" }))} />
          <p className="text-xs text-muted-foreground">{form.watch("photos").length} fotos enviadas</p>
        </div>

        <div className="space-y-2">
          <FormLabel>Vídeo (obrigatório, mínimo 5s)</FormLabel>
          <Input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files?.[0] ?? null).catch((err) => toast({ title: "Erro", description: err.message, variant: "destructive" }))} />
          <p className="text-xs text-muted-foreground">{form.watch("videoUrl") ? "Vídeo enviado" : "Nenhum vídeo enviado"}</p>
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isSubmitting}><Upload className="mr-2 h-4 w-4" />{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}{t.forms.submit_pet}</Button>
      </form>
    </Form>
  );
}
