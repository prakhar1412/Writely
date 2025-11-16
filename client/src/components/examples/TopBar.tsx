import { useState } from 'react';
import TopBar from '../TopBar';

export default function TopBarExample() {
  const [isLocked, setIsLocked] = useState(false);

  return (
    <TopBar
      roomCode="ABC123"
      userCount={4}
      isHost={true}
      isLocked={isLocked}
      onToggleLock={() => setIsLocked(!isLocked)}
      onLeave={() => console.log('Leave clicked')}
    />
  );
}
