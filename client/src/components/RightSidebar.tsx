import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Send } from 'lucide-react';
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
  isOnline?: boolean;
}

interface RightSidebarProps {
  messages?: Message[];
  participants?: Participant[];
  currentUsername?: string;
  onSendMessage?: (message: string) => void;
}

export default function RightSidebar({
  messages = [],
  participants = [],
  currentUsername = 'You',
  onSendMessage,
}: RightSidebarProps) {
  const [inputValue, setInputValue] = useState('');

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
    <div className="flex flex-col h-full w-80 bg-card border-l border-card-border">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b border-card-border">
          <h3 className="text-sm font-semibold text-foreground">Chat</h3>
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

      <div className="flex flex-col h-64">
        <div className="p-3 border-b border-card-border">
          <h3 className="text-sm font-semibold text-foreground">Participants ({participants.length})</h3>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-2">
            {participants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                username={participant.username}
                isSpeaking={participant.isSpeaking}
                isOnline={participant.isOnline}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
