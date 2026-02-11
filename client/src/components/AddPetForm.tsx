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

// Frontend validation to extend schema with sales check
const formSchema = insertPetSchema.extend({
  photos: z.array(z.string()).min(1, "At least one photo is required"),
  ageMonths: z.coerce.number().min(0),
  about: z.string().refine((val) => {
    const lowerVal = val.toLowerCase();
    return !BLOCKED_KEYWORDS.some(keyword => lowerVal.includes(keyword));
  }, {
    message: "Sales content detected. This platform is for mating and adoption only."
  })
});

type FormValues = z.infer<typeof formSchema>;

export function AddPetForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const createPet = useCreatePet();
  // const upload = useUpload(); // Implementation omitted for brevity, assuming standard hook pattern
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
      photos: ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=60"], // Mock default
      videoUrl: "",
      healthNotes: "",
    }
  });

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
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forms.name}</FormLabel>
                <FormControl><Input placeholder="Rex" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forms.species}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DOG">Dog</SelectItem>
                    <SelectItem value="CAT">Cat</SelectItem>
                    <SelectItem value="BIRD">Bird</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forms.breed}</FormLabel>
                <FormControl><Input placeholder="Golden Retriever" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="ageMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forms.age}</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forms.gender}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.forms.about}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your pet..." 
                  className="resize-none h-32"
                  {...field} 
                />
              </FormControl>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                {t.common.sales_warning}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-4">
           <FormField
            control={form.control}
            name="isDonation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Available for Adoption</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Mock Photo Upload UI */}
        <div className="space-y-2">
            <FormLabel>{t.forms.photos}</FormLabel>
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 hover:bg-muted/50 transition-colors cursor-not-allowed">
                <Upload size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Upload disabled in demo</p>
                <p className="text-xs opacity-50">Using Unsplash mock data</p>
            </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
          {t.forms.submit_pet}
        </Button>
      </form>
    </Form>
  );
}
