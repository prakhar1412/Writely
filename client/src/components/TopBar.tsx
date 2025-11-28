import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Lock, Unlock, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
  roomCode: string;
  userCount: number;
  isHost?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onLeave?: () => void;
}

export default function TopBar({
  roomCode,
  userCount,
  isHost = false,
  isLocked = false,
  onToggleLock,
  onLeave,
}: TopBarProps) {
  const { toast } = useToast();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-card-border">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Writely</h1>
        <Badge
          variant="secondary"
          data-testid="badge-room-code"
          className="font-mono"
        >
          {roomCode}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid="text-user-count">{userCount}</span>
        </div>



        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const url = `${window.location.origin}/room/${roomCode}`;
            navigator.clipboard.writeText(url);
            toast({
              description: "Link copied to clipboard",
            });
          }}
          data-testid="button-share"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onLeave}
          data-testid="button-leave"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </div>
    </div>
  );
}
