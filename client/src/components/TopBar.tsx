import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Lock, Unlock } from 'lucide-react';

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
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-card-border">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Writely</h1>
        <Badge variant="secondary" data-testid="badge-room-code" className="font-mono">
          {roomCode}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid="text-user-count">{userCount}</span>
        </div>

        {isHost && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleLock}
            data-testid="button-toggle-lock"
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlocked
              </>
            )}
          </Button>
        )}

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
