import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Gift, MessageCircle, User, LogOut, Car, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/app/match", icon: Heart, label: t.nav.match },
    { href: "/app/donate", icon: Gift, label: t.nav.donate },
    { href: "/app/chat", icon: MessageCircle, label: t.nav.chat },
    { href: "/app/mobipet", icon: Car, label: t.nav.mobipet },
    { href: "/app", icon: User, label: t.nav.profile },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-border p-6 z-50">
        <Link href="/" className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
          <span className="text-3xl">🐾</span>
          <h1 className="text-2xl font-display font-bold text-primary">PetCrushes</h1>
        </Link>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer",
                  location === item.href
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          {user && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar>
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.firstName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          {user ? (
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => logout()}
            >
              <LogOut size={16} />
              {t.nav.logout}
            </Button>
          ) : (
            <Link href="/auth">
              <Button variant="outline" className="w-full justify-start gap-2">
                <LogIn size={16} />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-border z-50 px-4 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors cursor-pointer",
                location === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon size={24} strokeWidth={location === item.href ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </>
  );
}
