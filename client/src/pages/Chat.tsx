import { useMatches, useMatch, useSendMessage } from "@/hooks/use-interactions";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical, ShieldAlert, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOCKED_KEYWORDS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { user } = useAuth();
  const { data: matches } = useMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const { data: activeMatch } = useMatch(selectedMatchId || 0);
  const sendMessage = useSendMessage();
  const [msgInput, setMsgInput] = useState("");
  const { toast } = useToast();

  const handleSend = () => {
    if (!msgInput.trim() || !selectedMatchId) return;

    // Safety check
    const lower = msgInput.toLowerCase();
    if (BLOCKED_KEYWORDS.some(k => lower.includes(k))) {
      toast({
        title: "Message Blocked",
        description: "Safety Alert: Discussion of payments or sales is prohibited.",
        variant: "destructive"
      });
      return;
    }

    sendMessage.mutate({ matchId: selectedMatchId, content: msgInput });
    setMsgInput("");
  };

  return (
    <div className="h-[calc(100vh-2rem)] container mx-auto p-4 flex gap-4 max-w-6xl">
      {/* Sidebar List */}
      <Card className="w-80 flex flex-col overflow-hidden border-none shadow-lg">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-display font-bold text-lg">Matches</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2 gap-1">
            {matches?.map(match => {
                // Determine which pet is the "other" one
                // Simplified: Assuming match contains petA and petB
                // We'd compare with user's pet ID usually.
                // For MVP, just show petA's info if we are not petA (logic omitted for brevity)
                const otherPet = match.petA; 
                
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors text-left hover:bg-secondary/50",
                      selectedMatchId === match.id ? "bg-secondary" : ""
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={otherPet.photos[0]} />
                      <AvatarFallback>{otherPet.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold truncate">{otherPet.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">Say hello! 👋</p>
                    </div>
                  </button>
                );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-lg">
        {selectedMatchId && activeMatch ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={activeMatch.petA.photos[0]} />
                    <AvatarFallback>?</AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="font-bold">{activeMatch.petA.displayName}</h3>
                    <div className="flex items-center gap-1 text-xs text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                    </div>
                 </div>
              </div>
              <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-muted/10">
                <div className="space-y-4">
                    <div className="flex justify-center my-4">
                        <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <ShieldAlert size={12} />
                            Safety Tip: Never send money to anyone.
                        </div>
                    </div>
                    
                    {activeMatch.messages?.map(msg => (
                        <div key={msg.id} className={cn("flex", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm",
                                msg.senderId === user?.id 
                                    ? "bg-primary text-primary-foreground rounded-br-none" 
                                    : "bg-white text-foreground rounded-bl-none"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-white border-t flex gap-2">
                <Input 
                    placeholder="Type a message..." 
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 rounded-full bg-muted/30 border-none focus-visible:ring-1"
                />
                <Button size="icon" className="rounded-full" onClick={handleSend} disabled={!msgInput.trim()}>
                    <Send size={18} />
                </Button>
            </div>
          </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <MessageCircle size={64} className="mb-4" />
                <p>Select a match to start chatting</p>
            </div>
        )}
      </Card>
    </div>
  );
}
