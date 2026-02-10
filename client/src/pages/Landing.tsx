import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐾</span>
          <h1 className="text-2xl font-display font-bold text-primary">PetCrushes</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link href="/auth">
            <Button>{t.nav.login}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-in slide-in-from-left duration-700">
          <h1 className="text-5xl md:text-7xl font-display font-black text-foreground leading-tight">
            {t.hero.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                {t.hero.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {["Identity Verified", "No Sales Allowed", "Secure Chat"].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="text-primary h-5 w-5" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block h-[600px] w-full animate-in zoom-in duration-1000 delay-200">
            {/* Abstract Background Blobs */}
            <div className="absolute top-0 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary rounded-full blur-3xl animate-pulse" />
            
            {/* Hero Image - Golden Retriever and Cat */}
            {/* Unsplash image of dog and cat together */}
            <img 
              src="https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?q=80&w=1000&auto=format&fit=crop"
              alt="Happy Pets"
              className="absolute inset-0 w-full h-full object-cover rounded-[3rem] shadow-2xl ring-8 ring-white transform rotate-3 hover:rotate-0 transition-transform duration-500"
            />
        </div>
      </main>
      
      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2024 PetCrushes. All rights reserved.
      </footer>
    </div>
  );
}
