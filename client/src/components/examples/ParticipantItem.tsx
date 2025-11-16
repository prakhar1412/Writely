import ParticipantItem from '../ParticipantItem';

export default function ParticipantItemExample() {
  return (
    <div className="p-4 space-y-2 bg-background">
      <ParticipantItem username="Alice Johnson" isSpeaking={true} isOnline={true} />
      <ParticipantItem username="Bob Smith" isSpeaking={false} isOnline={true} />
      <ParticipantItem username="Charlie Brown" isSpeaking={false} isOnline={false} />
    </div>
  );
}
