"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Plus,
  DoorOpen,
  Copy,
  Check,
  Users,
  MessageCircle,
} from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorPage } from "@/components/ui/error";

interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
  messageCount: number;
  memberCount: number;
}

export default function ChatsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch(`${apiUrl}/chat/rooms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const data = await res.json();
      setRooms(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    fetchRooms();
  }, [router, fetchRooms]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      addToast({
        type: "warning",
        title: "Room name required",
        description: "Please enter a name for your room",
      });
      return;
    }

    setIsCreatingRoom(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create room");
      }

      const data = await res.json();
      setRooms((prev) => [data, ...prev]);
      setRoomName("");
      addToast({
        type: "success",
        title: "Room created",
        description: `Successfully created "${data.name}"`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create room";
      addToast({
        type: "error",
        title: "Failed to create room",
        description: errorMessage,
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      addToast({
        type: "warning",
        title: "Room ID required",
        description: "Please enter a room ID to join",
      });
      return;
    }

    setIsJoiningRoom(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: joinRoomId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          addToast({
            type: "warning",
            title: "Already a member",
            description: "You're already a member of this room",
          });
        } else if (res.status === 404) {
          addToast({
            type: "error",
            title: "Room not found",
            description: "The room ID you entered doesn't exist",
          });
        } else {
          throw new Error(errorData.message || "Failed to join room");
        }
        return;
      }

      await fetchRooms();
      setJoinRoomId("");
      addToast({
        type: "success",
        title: "Joined room",
        description: "Successfully joined the room",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join room";
      addToast({
        type: "error",
        title: "Failed to join room",
        description: errorMessage,
      });
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCopyRoomId = async (roomId: string, roomName: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(roomId);
      addToast({
        type: "success",
        title: "Room ID copied",
        description: `Room ID for "${roomName}" copied to clipboard`,
      });

      setTimeout(() => {
        setCopiedRoomId(null);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not copy room ID to clipboard";
      addToast({
        type: "error",
        title: "Failed to copy",
        description: errorMessage,
      });
    }
  };

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError("");
    fetchRooms();
  }, [fetchRooms]);

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <LoadingPage
        title="Loading your chat rooms..."
        description="Please wait while we fetch your conversations"
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        title="Failed to load chat rooms"
        description={error}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="p-4">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chat Rooms</h1>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="New room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isCreatingRoom && handleCreateRoom()
            }
            disabled={isCreatingRoom}
          />
          <Button
            onClick={handleCreateRoom}
            disabled={isCreatingRoom || !roomName.trim()}
          >
            {isCreatingRoom ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Room ID to join"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isJoiningRoom && handleJoinRoom()
            }
            disabled={isJoiningRoom}
          />
          <Button
            onClick={handleJoinRoom}
            disabled={isJoiningRoom || !joinRoomId.trim()}
          >
            {isJoiningRoom ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Joining...
              </>
            ) : (
              <>
                <DoorOpen className="h-4 w-4 mr-2" />
                Join
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No chat rooms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first room or join an existing one to get started
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="group border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <Link href={`/chats/${room.id}`} className="block">
                <div className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {room.name}
                    </h2>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {new Date(room.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{room.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{room.messageCount} messages</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="px-4 pb-4">
                <div className="flex items-center justify-between bg-muted/50 rounded-md p-2 border border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Room ID
                    </span>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded border truncate">
                      {room.id}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopyRoomId(room.id, room.name);
                    }}
                    className="flex-shrink-0 h-8 px-2 text-xs hover:bg-background/80"
                  >
                    {copiedRoomId === room.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
