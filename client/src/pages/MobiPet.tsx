import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Car, Clock, ShieldCheck, Map } from "lucide-react";

export default function MobiPet() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto p-6 max-w-4xl h-full flex flex-col justify-center">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-slate-800 text-white shadow-2xl p-12 text-center min-h-[600px] flex flex-col items-center justify-center">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md mb-4 border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <Car className="w-12 h-12 text-blue-200" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight">
                {t.mobipet.title}
            </h1>
            
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-sm font-medium border border-blue-500/30">
                {t.mobipet.subtitle}
            </div>

            <p className="text-xl text-indigo-200 leading-relaxed">
                {t.mobipet.desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-sm font-medium text-indigo-300">
                <div className="flex flex-col items-center gap-2">
                    <ShieldCheck className="w-8 h-8 opacity-70" />
                    <span>Verified Drivers</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Map className="w-8 h-8 opacity-70" />
                    <span>Real-time Tracking</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 opacity-70" />
                    <span>Schedule Ahead</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button disabled size="lg" className="bg-white/10 hover:bg-white/20 text-white border-none h-14 px-8 backdrop-blur-sm">
                    {t.mobipet.driver_btn}
                </Button>
                <Button disabled size="lg" className="bg-blue-500 hover:bg-blue-600 text-white h-14 px-8 shadow-lg shadow-blue-500/25">
                    {t.mobipet.ride_btn}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
