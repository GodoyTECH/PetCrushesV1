import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export type LocationValue = {
  region: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  placeId?: string;
};

function pickComponent(list: any[] | undefined, type: string) {
  return list?.find((item) => item.types?.includes(type))?.long_name;
}

export function LocationInput({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [raw, setRaw] = useState(value.region || "");

  useEffect(() => setRaw(value.region || ""), [value.region]);

  useEffect(() => {
    if (!mapsKey || !inputRef.current) return;

    const setupAutocomplete = () => {
      const google = (window as any).google;
      if (!google?.maps?.places || !inputRef.current) return;
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["address_components", "formatted_address", "place_id"],
        types: ["(regions)"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const country = pickComponent(place.address_components, "country");
        const state = pickComponent(place.address_components, "administrative_area_level_1");
        const city = pickComponent(place.address_components, "locality") || pickComponent(place.address_components, "administrative_area_level_2");
        const neighborhood = pickComponent(place.address_components, "sublocality") || pickComponent(place.address_components, "neighborhood");
        const region = [city, state, country].filter(Boolean).join(", ") || place.formatted_address || raw;
        onChange({ region, country, state, city, neighborhood, placeId: place.place_id });
      });
    };

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).google?.maps?.places) setupAutocomplete();
      else existingScript.addEventListener("load", setupAutocomplete, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = setupAutocomplete;
    document.body.appendChild(script);
  }, [mapsKey, onChange, raw]);

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <Input
        ref={inputRef}
        value={raw}
        placeholder="Cidade, Estado, País"
        onChange={(event) => {
          const next = event.target.value;
          setRaw(next);
          onChange({ ...value, region: next });
        }}
      />
      <p className="text-xs text-muted-foreground">
        {mapsKey
          ? "Use localização aproximada. Não informe endereço completo. / Use approximate location only."
          : "Autocomplete indisponível. Preencha cidade/estado/país nos campos abaixo."}
      </p>
    </div>
  );
}
