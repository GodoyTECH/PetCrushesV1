export type PetSpecies = "DOG" | "CAT" | "BIRD" | "RABBIT" | "GUINEA_PIG" | "HAMSTER" | "OTHER";

export const SPECIES_LABELS: Record<PetSpecies, { pt: string; en: string }> = {
  DOG: { pt: "Cachorro", en: "Dog" },
  CAT: { pt: "Gato", en: "Cat" },
  BIRD: { pt: "Ave", en: "Bird" },
  RABBIT: { pt: "Coelho", en: "Rabbit" },
  GUINEA_PIG: { pt: "Porquinho-da-Índia", en: "Guinea pig" },
  HAMSTER: { pt: "Hamster", en: "Hamster" },
  OTHER: { pt: "Outro", en: "Other" },
};

export const BREEDS_BY_SPECIES: Record<PetSpecies, string[]> = {
  BIRD: ["Canário", "Periquito-australiano", "Calopsita", "Agapornis", "Caturrita (Quaker / Monk Parakeet)", "Ring Neck", "Diamante Mandarim", "Diamante de Gould", "Cacatua", "Arara", "Outro"],
  DOG: ["Vira-lata / Caramelo", "Labrador Retriever", "Golden Retriever", "Poodle", "Beagle", "Bulldog", "Shih Tzu", "Spitz Alemão", "Yorkshire Terrier", "Pastor Alemão", "Husky Siberiano", "Rottweiler", "Dachshund (Salsicha)", "Border Collie", "Pug", "Maltês", "Doberman Pinscher", "Outro"],
  CAT: ["Maine Coon", "Persa", "Siamês", "Ragdoll", "Bengal", "Sphynx", "Abissínio (Abyssinian)", "British Shorthair", "Scottish Fold", "Birman", "Burmese", "American Shorthair", "Outro"],
  RABBIT: ["Holland Lop", "Mini Lop", "Netherland Dwarf", "Lionhead", "Rex", "Flemish Giant", "New Zealand", "Californian", "English Angora", "Dutch", "Outro"],
  GUINEA_PIG: ["American", "Abyssinian", "Coronet", "Peruvian", "Silkie", "Skinny Pig", "Teddy", "Texel", "White Crested", "Baldwin", "Outro"],
  HAMSTER: ["Sírio", "Anão Russo", "Roborovski", "Chinês", "Campbell", "Outro"],
  OTHER: ["Outro"],
};

export const SPECIES_OPTIONS = Object.keys(SPECIES_LABELS) as PetSpecies[];

export function getSpeciesLabel(species: PetSpecies, lang: "pt-BR" | "en") {
  const labels = SPECIES_LABELS[species];
  return lang === "pt-BR" ? labels.pt : labels.en;
}
