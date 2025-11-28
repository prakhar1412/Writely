import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ParticipantItem from './ParticipantItem';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  username: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isHandRaised?: boolean;
  isOnline?: boolean;
}

interface RightSidebarProps {
  messages?: Message[];
  participants?: Participant[];
  currentUsername?: string;
  currentUserId?: string | null;
  hostId?: string;
  onSendMessage?: (message: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isHandRaised?: boolean;
  onToggleHand?: () => void;
}

export default function RightSidebar({
  messages = [],
  participants = [],
  currentUsername = 'You',
  currentUserId,
  hostId,
  onSendMessage,
  isMuted = false,
  onToggleMute,
  isHandRaised = false,
  onToggleHand,
}: RightSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage?.(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col w-80 bg-card/90 backdrop-blur shadow-2xl rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-auto' : 'h-[600px]'
        }`}
    >
      <div className="p-3 border-b border-card-border flex items-center justify-between bg-muted/30 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className="text-sm font-semibold text-foreground">Collaboration</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 bg-muted/10">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Chat</h4>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    username={message.username}
                    text={message.text}
                    timestamp={message.timestamp}
                    isOwnMessage={message.username === currentUsername}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-card-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  data-testid="input-chat-message"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col h-48">
            <div className="p-2 bg-muted/10 border-b border-card-border">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Participants ({participants.length})</h4>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col gap-2">
                {participants.map((participant) => (
                  <ParticipantItem
                    key={participant.id}
                    username={participant.username}
                    isSpeaking={participant.isSpeaking}
                    isMuted={participant.username === currentUsername ? isMuted : participant.isMuted}
                    isHandRaised={participant.username === currentUsername ? isHandRaised : participant.isHandRaised}
                    isOnline={participant.isOnline}
                    isCurrentUser={currentUserId ? participant.id === currentUserId : participant.username === currentUsername}
                    isHost={participant.username === hostId}
                    onToggleMute={onToggleMute}
                    onToggleHand={onToggleHand}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
