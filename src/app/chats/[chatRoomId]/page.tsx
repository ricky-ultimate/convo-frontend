"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Copy, Check } from "lucide-react";
import { LoadingPage, LoadingSpinner } from "@/components/ui/loading";
import { ErrorPage } from "@/components/ui/error";
import { Toast, useToast } from "@/components/ui/toast";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface RoomInfo {
  id: string;
  name: string;
  memberCount: number;
}

export default function ChatRoom() {
  const { chatRoomId } = useParams();
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [error, setError] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const roomId = Array.isArray(chatRoomId) ? chatRoomId[0] : chatRoomId;

  const { sendMessage: socketSendMessage, messages: socketMessages } =
    useSocket(roomId || "");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchRoomInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/room/${roomId}`, {
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

      if (res.status === 404) {
        setError("Room not found");
        return;
      }

      if (res.status === 403) {
        setError("You don't have access to this room");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch room information");
      }

      const data = await res.json();
      setRoomInfo(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load room information"
      );
    }
  }, [apiUrl, roomId, router]);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/room/${roomId}/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      if (res.status === 404) {
        setError("Room not found");
        return;
      }

      if (res.status === 403) {
        setError("You don't have access to this room");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [apiUrl, roomId, router]);

  useEffect(() => {
    if (!roomId) {
      setError("Invalid room ID");
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const loadRoomData = async () => {
      await Promise.all([fetchRoomInfo(), fetchMessages()]);
      setIsLoading(false);
    };

    loadRoomData();
  }, [roomId, router, fetchRoomInfo, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, socketMessages]);

  const handleSend = async () => {
    if (!message.trim() || !roomId || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      socketSendMessage(message);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCopyRoomId = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      addToast({
        type: "success",
        title: "Room ID copied",
        description: "Room ID copied to clipboard",
      });

      setTimeout(() => {
        setCopiedRoomId(false);
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
    setIsLoadingMessages(true);
    setError("");
    const loadRoomData = async () => {
      await Promise.all([fetchRoomInfo(), fetchMessages()]);
      setIsLoading(false);
    };
    loadRoomData();
  }, [fetchRoomInfo, fetchMessages]);

  const handleGoBack = () => {
    router.push("/chats");
  };

  if (!roomId) {
    return (
      <ErrorPage
        title="Invalid Room"
        description="The room ID provided is not valid"
        onGoHome={handleGoBack}
        showRetry={false}
      />
    );
  }

  if (isLoading) {
    return (
      <LoadingPage
        title="Loading chat room..."
        description="Please wait while we prepare your conversation"
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        title="Failed to load chat room"
        description={error}
        onRetry={handleRetry}
        onGoHome={handleGoBack}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen">
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

      <div className="border-b p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            {roomInfo?.name || `Room: ${roomId}`}
          </h2>
          {roomInfo && (
            <p className="text-sm text-muted-foreground">
              {roomInfo.memberCount}{" "}
              {roomInfo.memberCount === 1 ? "member" : "members"}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyRoomId}
          className="flex-shrink-0"
        >
          {copiedRoomId ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Room ID
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {[...messages, ...socketMessages].length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Be the first to start the conversation!
                </p>
              </div>
            ) : (
              [...messages, ...socketMessages].map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{msg.user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) =>
              e.key === "Enter" && !isSendingMessage && handleSend()
            }
            disabled={isSendingMessage}
          />
          <Button
            onClick={handleSend}
            disabled={isSendingMessage || !message.trim()}
          >
            {isSendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
