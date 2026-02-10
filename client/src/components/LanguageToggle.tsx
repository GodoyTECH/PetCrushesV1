import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-1 bg-secondary/50 p-1 rounded-full">
      <Button
        variant={lang === 'pt-BR' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLang('pt-BR')}
        className="rounded-full text-xs h-7 px-3"
      >
        PT
      </Button>
      <Button
        variant={lang === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLang('en')}
        className="rounded-full text-xs h-7 px-3"
      >
        EN
      </Button>
    </div>
  );
}
