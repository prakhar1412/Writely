import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Pen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Room } from '@shared/schema';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest<{ room: Room }>('/api/rooms/create', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });

      if (response) {
        setLocation(`/room/${response.room.code}?username=${encodeURIComponent(username)}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode.toUpperCase()}`);
      if (response.ok) {
        setLocation(`/room/${roomCode.toUpperCase()}?username=${encodeURIComponent(username)}`);
      } else {
        alert('Room not found');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <Pen className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Writely</h1>
          </div>
          <p className="text-muted-foreground">Real-time collaborative whiteboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create a new room or join an existing one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" data-testid="tab-create">Create Room</TabsTrigger>
                <TabsTrigger value="join" data-testid="tab-join">Join Room</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Your Name</Label>
                  <Input
                    id="create-username"
                    data-testid="input-create-username"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
                </div>
                <Button
                  onClick={handleCreateRoom}
                  disabled={!username.trim() || isLoading}
                  className="w-full"
                  data-testid="button-create-room"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="join" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="join-username">Your Name</Label>
                  <Input
                    id="join-username"
                    data-testid="input-join-username"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-code">Room Code</Label>
                  <Input
                    id="room-code"
                    data-testid="input-room-code"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={!username.trim() || !roomCode.trim() || isLoading}
                  className="w-full"
                  data-testid="button-join-room"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Room'
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Draw, chat, and collaborate in real-time
        </p>
      </div>
    </div>
  );
}
