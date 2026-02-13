export function formatAgeMonths(ageMonths?: number | null) {
  if (!Number.isFinite(ageMonths as number) || (ageMonths as number) < 0) return "Idade não informada";
  const value = Number(ageMonths);
  return `${value} meses`;
}

export function formatPetLocation(pet: any) {
  const neighborhood = pet?.neighborhood?.trim?.();
  const city = pet?.city?.trim?.();
  const state = pet?.state?.trim?.();
  const country = pet?.country?.trim?.();

  if (neighborhood && city) return `${neighborhood}, ${city}`;
  const precise = [city, state, country].filter(Boolean).join(", ");
  if (precise) return precise;
  return pet?.region || "Localização não informada";
}
