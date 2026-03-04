import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pen, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "create";
  const initialCode = searchParams.get("code") || "";
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/rooms/create", { username: trimmed });
      const data = await response.json();
      if (data.room) {
        setLocation(`/room/${data.room.code}?username=${encodeURIComponent(trimmed)}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      toast({ variant: "destructive", description: "Failed to create room. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedUser = username.trim();
    const trimmedCode = roomCode.trim().toUpperCase();
    if (!trimmedUser || !trimmedCode) return;

    if (!/^[A-Z0-9]{6}$/.test(trimmedCode)) {
      toast({ variant: "destructive", description: "Room code must be 6 alphanumeric characters." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${trimmedCode}`);
      if (response.ok) {
        setLocation(`/room/${trimmedCode}?username=${encodeURIComponent(trimmedUser)}`);
      } else {
        toast({ variant: "destructive", description: "Room not found. Check the code and try again." });
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      toast({ variant: "destructive", description: "Failed to join room. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-secondary/20 blur-[80px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 px-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="p-4 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-xl">
              <Pen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Writely
            </h1>
          </motion.div>
          <p className="text-muted-foreground text-lg">
            Real-time collaborative whiteboard for creative teams
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Get Started
            </CardTitle>
            <CardDescription>
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create" data-testid="tab-create">
                  Create Room
                </TabsTrigger>
                <TabsTrigger value="join" data-testid="tab-join">
                  Join Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Your Name</Label>
                  <Input
                    id="create-username"
                    data-testid="input-create-username"
                    placeholder="Enter your name"
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <Button
                  onClick={handleCreateRoom}
                  disabled={!username.trim() || isLoading}
                  className="w-full text-lg h-12 shadow-lg hover:shadow-primary/25 transition-all"
                  data-testid="button-create-room"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="join" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-username">Your Name</Label>
                  <Input
                    id="join-username"
                    data-testid="input-join-username"
                    placeholder="Enter your name"
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
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
                    onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                    className="font-mono bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={!username.trim() || !roomCode.trim() || isLoading}
                  className="w-full text-lg h-12 shadow-lg hover:shadow-primary/25 transition-all"
                  data-testid="button-join-room"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Room"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Draw, chat, and collaborate in real-time
        </p>
      </motion.div>
    </div>
  );
}
