import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Gift, MessageCircle, User, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoUrl from "../../../logo.png";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) return null;

  const fallback = user.displayName?.[0] || user.firstName?.[0] || user.email?.[0] || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocation('/app/profile/edit')}>Editar perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout()}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: "/app/match", icon: Heart, label: t.nav.match },
    { href: "/app/donate", icon: Gift, label: t.nav.donate },
    { href: "/app/chat", icon: MessageCircle, label: t.nav.chat },
    { href: "/app/mobipet", icon: Car, label: t.nav.mobipet },
    { href: "/app", icon: User, label: t.nav.profile },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-border p-6 z-50">
        <Link href="/" className="mb-10 hover:opacity-80 transition-opacity block">
          <img src={logoUrl} alt="PetCrushes" className="w-full max-w-[200px] h-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </Link>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer", location === item.href ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground")}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-border z-50 px-4 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn("flex flex-col items-center justify-center p-2 rounded-lg transition-colors cursor-pointer", location === item.href ? "text-primary" : "text-muted-foreground hover:bg-secondary/50")}>
              <item.icon size={24} strokeWidth={location === item.href ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </>
  );
}
