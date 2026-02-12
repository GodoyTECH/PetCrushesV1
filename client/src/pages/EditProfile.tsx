import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EditProfile() {
  const { user, updateMe, isUpdatingMe } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiFetch("/api/media/upload", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 503) {
          setUploadError(payload?.error?.message ?? "Upload indisponível no momento. Tente novamente.");
          return;
        }
        throw new Error(payload?.error?.message ?? "Falha ao enviar foto.");
      }
      if (payload?.url) {
        setProfileImageUrl(payload.url);
        setPendingFile(null);
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    try {
      await updateMe({
        displayName: displayName.trim(),
        whatsapp: whatsapp.trim() || undefined,
        region: region.trim() || undefined,
        profileImageUrl: profileImageUrl || undefined,
      });
      toast({ title: "Perfil atualizado", description: "Suas alterações foram salvas." });
      setLocation("/app");
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar seu perfil agora.", variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Editar perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Foto (opcional)</Label>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12"><AvatarImage src={profileImageUrl || undefined} /><AvatarFallback>{displayName?.[0] || user?.email?.[0] || "U"}</AvatarFallback></Avatar>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPendingFile(file);
                if (file) uploadFile(file);
              }} disabled={isUploading} />
            </div>
            {isUploading ? <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando foto...</p> : null}
            {uploadError ? (
              <div className="text-sm text-destructive space-y-2">
                <p>{uploadError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => pendingFile && uploadFile(pendingFile)} disabled={!pendingFile || isUploading}>Tentar novamente</Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2"><Label>Nome público</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div className="space-y-2"><Label>WhatsApp (opcional)</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 (11) 99999-9999" /></div>
          <div className="space-y-2"><Label>Região (opcional)</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} /></div>

          <Button onClick={handleSave} disabled={isUpdatingMe || isUploading} className="w-full">{isUpdatingMe ? "Salvando..." : "Salvar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
