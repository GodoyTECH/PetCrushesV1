import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoUrl from "../../../logo.png";

const LOCATION_OPTIONS = {
  BR: { name: "Brasil", states: { SP: ["São Paulo", "Campinas", "Santos"], RJ: ["Rio de Janeiro", "Niterói", "Petrópolis"], MG: ["Belo Horizonte", "Uberlândia", "Juiz de Fora"] } },
  US: { name: "United States", states: { CA: ["Los Angeles", "San Diego", "San Francisco"], FL: ["Miami", "Orlando", "Tampa"], TX: ["Austin", "Dallas", "Houston"] } },
} as const;

type CountryCode = keyof typeof LOCATION_OPTIONS;

function buildRegion(countryCode: string, stateCode: string, city: string) {
  const country = LOCATION_OPTIONS[countryCode as CountryCode]?.name ?? countryCode;
  return `${country} - ${stateCode} - ${city}`;
}

export default function Onboarding() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, updateMe, isUpdatingMe } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [country, setCountry] = useState<CountryCode>("BR");
  const [stateCode, setStateCode] = useState("SP");
  const [city, setCity] = useState("São Paulo");

  const states = useMemo(() => Object.keys(LOCATION_OPTIONS[country].states), [country]);
  const cities = useMemo<string[]>(() => Array.from((LOCATION_OPTIONS[country].states as Record<string, readonly string[]>)[stateCode] ?? []), [country, stateCode]);

  async function handleSubmit() {
    if (!displayName.trim() || !city) {
      toast({ title: t.common.error, description: t.onboarding.errors.requiredFields, variant: "destructive" });
      return;
    }

    try {
      await updateMe({
        displayName: displayName.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        region: buildRegion(country, stateCode, city),
        onboardingCompleted: true,
      });

      toast({ title: t.onboarding.successTitle, description: t.onboarding.successDescription });
      setLocation("/app");
    } catch {
      toast({ title: t.common.error, description: t.onboarding.errors.saveFailed, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mx-auto mb-4">
            <img src={logoUrl} alt="PetCrushes" className="w-full max-w-[220px] h-auto object-contain" />
          </div>
          <CardTitle>{t.onboarding.title}</CardTitle>
          <CardDescription>{t.onboarding.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.onboarding.displayName}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.whatsapp}</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t.onboarding.whatsappPlaceholder} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.onboarding.firstName}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.lastName}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t.onboarding.country}</Label>
              <Select value={country} onValueChange={(value: CountryCode) => {
                setCountry(value);
                const firstState = Object.keys(LOCATION_OPTIONS[value].states)[0];
                setStateCode(firstState);
                const firstCity = (LOCATION_OPTIONS[value].states as Record<string, readonly string[]>)[firstState]?.[0] ?? "";
                setCity(firstCity);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(LOCATION_OPTIONS).map(([code, cfg]) => (<SelectItem key={code} value={code}>{cfg.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.state}</Label>
              <Select value={stateCode} onValueChange={(value) => { setStateCode(value); setCity((LOCATION_OPTIONS[country].states as Record<string, readonly string[]>)[value]?.[0] ?? ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{states.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.city}</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cities.map((cityName: string) => (<SelectItem key={cityName} value={cityName}>{cityName}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={isUpdatingMe}>
            {isUpdatingMe ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isUpdatingMe ? t.onboarding.saving : t.onboarding.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
