import RightSidebar from '../RightSidebar';

export default function RightSidebarExample() {
  const mockMessages = [
    { id: '1', username: 'Alice', text: 'Hey everyone!', timestamp: new Date(Date.now() - 300000) },
    { id: '2', username: 'You', text: 'Hi Alice! Ready to brainstorm?', timestamp: new Date(Date.now() - 240000) },
    { id: '3', username: 'Bob', text: 'Great idea! Let me add some notes.', timestamp: new Date(Date.now() - 180000) },
    { id: '4', username: 'Alice', text: 'Perfect, I will draw the flowchart.', timestamp: new Date(Date.now() - 120000) },
  ];

  const mockParticipants = [
    { id: '1', username: 'You', isSpeaking: false, isOnline: true },
    { id: '2', username: 'Alice', isSpeaking: true, isOnline: true },
    { id: '3', username: 'Bob', isSpeaking: false, isOnline: true },
    { id: '4', username: 'Charlie', isSpeaking: false, isOnline: true },
  ];

  return (
    <div className="h-screen">
      <RightSidebar
        messages={mockMessages}
        participants={mockParticipants}
        currentUsername="You"
        onSendMessage={(msg) => console.log('Send message:', msg)}
      />
    </div>
  );
}
