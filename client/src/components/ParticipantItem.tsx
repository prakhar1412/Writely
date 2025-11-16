import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ParticipantItemProps {
  username: string;
  isSpeaking?: boolean;
  isOnline?: boolean;
}

export default function ParticipantItem({
  username,
  isSpeaking = false,
  isOnline = true,
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

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{username}</p>
      </div>

      {isSpeaking && (
        <Badge variant="secondary" className="text-xs animate-pulse">
          Speaking
        </Badge>
      )}
    </div>
  );
}
