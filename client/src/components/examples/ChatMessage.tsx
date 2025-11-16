import ChatMessage from '../ChatMessage';

export default function ChatMessageExample() {
  return (
    <div className="p-4 space-y-4 bg-background">
      <ChatMessage
        username="Alice"
        text="Hey, how are you doing?"
        timestamp={new Date(Date.now() - 300000)}
        isOwnMessage={false}
      />
      <ChatMessage
        username="You"
        text="I'm doing great! Just working on this whiteboard feature."
        timestamp={new Date(Date.now() - 120000)}
        isOwnMessage={true}
      />
    </div>
  );
}
