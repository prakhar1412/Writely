import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Hand, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantItemProps {
  username: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isHandRaised?: boolean;
  isOnline?: boolean;
  isCurrentUser?: boolean;
  isHost?: boolean;
  onToggleMute?: () => void;
  onToggleHand?: () => void;
}

export default function ParticipantItem({
  username,
  isSpeaking = false,
  isMuted = false,
  isHandRaised = false,
  isOnline = true,
  isCurrentUser = false,
  isHost = false,
  onToggleMute,
  onToggleHand,
}: ParticipantItemProps) {
  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-md transition-colors hover-elevate',
        isSpeaking && 'bg-primary/10'
      )}
      data-testid={`participant-${username}`}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card',
            isOnline ? 'bg-status-online' : 'bg-status-offline'
          )}
        />
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-sm font-medium text-foreground truncate">{username}</p>
        {isHost && (
          <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        )}
      </div>

      {isSpeaking && (
        <Badge variant="secondary" className="text-xs animate-pulse mr-2">
          Speaking
        </Badge>
      )}

      <div className="flex items-center gap-1">
        {isCurrentUser ? (
          <>
            <Button
              variant={isHandRaised ? "default" : "ghost"}
              size="icon"
              className={cn("h-7 w-7", isHandRaised && "bg-yellow-500 hover:bg-yellow-600 text-black")}
              onClick={onToggleHand}
            >
              <Hand className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={isMuted ? "destructive" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={onToggleMute}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </Button>
          </>
        ) : (
          <>
            {isHandRaised && (
              <div className="p-1.5 bg-yellow-500/10 rounded-full">
                <Hand className="h-3.5 w-3.5 text-yellow-500" />
              </div>
            )}
            <div className={cn("p-1.5 rounded-full", isMuted ? "bg-destructive/10" : "bg-primary/10")}>
              {isMuted ? (
                <MicOff className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Mic className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
