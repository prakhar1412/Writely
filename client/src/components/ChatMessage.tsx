import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  username: string;
  text: string;
  timestamp: Date;
  isOwnMessage?: boolean;
}

export default function ChatMessage({
  username,
  text,
  timestamp,
  isOwnMessage = false,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isOwnMessage && 'items-end'
      )}
      data-testid={`message-${username}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-foreground">{username}</span>
        <span className="text-xs text-muted-foreground">
          {format(timestamp, 'h:mm a')}
        </span>
      </div>
      <div
        className={cn(
          'px-3 py-2 rounded-lg max-w-[85%]',
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <p className="text-sm break-words">{text}</p>
      </div>
    </div>
  );
}
