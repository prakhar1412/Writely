import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Lock, Unlock, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
  roomCode: string;
  username?: string;
  userCount: number;
  isHost?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onLeave?: () => void;
}

export default function TopBar({
  roomCode,
  username,
  userCount,
  isHost = false,
  isLocked = false,
  onToggleLock,
  onLeave,
}: TopBarProps) {
  const { toast } = useToast();

  const handleShare = () => {
    // Build a "ready-to-join" URL that pre-fills both room code and username
    const base = `${window.location.origin}/room/${roomCode}`;
    const url = username
      ? `${base}?username=${encodeURIComponent(username)}`
      : base;

    navigator.clipboard.writeText(url).then(() => {
      toast({ description: "Invite link copied to clipboard 🔗" });
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Writely</h1>
        <Badge variant="secondary" data-testid="badge-room-code" className="font-mono">
          {roomCode}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Participant count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid="text-user-count">{userCount}</span>
        </div>

        {/* Lock / Unlock (host only) */}
        {isHost && (
          <Button
            size="sm"
            variant={isLocked ? "destructive" : "ghost"}
            onClick={onToggleLock}
            data-testid="button-toggle-lock"
            title={isLocked ? "Unlock board" : "Lock board"}
          >
            {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            {isLocked ? "Locked" : "Lock"}
          </Button>
        )}

        {/* Share */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleShare}
          data-testid="button-share"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {/* Leave */}
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
