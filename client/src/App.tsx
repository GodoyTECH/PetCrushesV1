import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import MatchFeed from "@/pages/MatchFeed";
import AdoptionFeed from "@/pages/AdoptionFeed";
import Chat from "@/pages/Chat";
import MobiPet from "@/pages/MobiPet";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";

function AppShell({ component: Component }: { component: React.ComponentType }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-body selection:bg-primary/20">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-x-hidden">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Protected App Routes */}
      <Route path="/app">
         <AppShell component={Dashboard} />
      </Route>
      <Route path="/app/match">
         <AppShell component={MatchFeed} />
      </Route>
      <Route path="/app/donate">
         <AppShell component={AdoptionFeed} />
      </Route>
      <Route path="/app/chat">
         <AppShell component={Chat} />
      </Route>
      <Route path="/app/mobipet">
         <AppShell component={MobiPet} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
