import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// Helper function to get all chat conversations for a doctor
const getAllDoctorChats = (doctorId) => {
  const chats = [];
  const keys = Object.keys(localStorage);
  const chatMap = new Map(); // Use Map to avoid duplicates
  
  // Normalize ID for comparison (handle both string and object IDs)
  const normalizeId = (id) => {
    if (!id) return null;
    return typeof id === 'object' ? id.toString() : String(id);
  };
  
  const doctorIdStr = normalizeId(doctorId);
  
  keys.forEach((key) => {
    if (key.startsWith("chat_")) {
      try {
        const messages = JSON.parse(localStorage.getItem(key));
        if (messages && messages.length > 0) {
          // Extract patientId and doctorId from key format: chat_patientId_doctorId
          const keyWithoutPrefix = key.replace("chat_", "");
          const parts = keyWithoutPrefix.split("_");
          
          if (parts.length >= 2) {
            // The key format is: chat_patientId_doctorId
            // So parts[0] is patientId, and the rest joined is doctorId
            const patientId = parts[0];
            const keyDoctorId = parts.slice(1).join("_");
            
            // Check if this chat belongs to this doctor (by key OR by messages)
            const keyMatchesDoctor = keyDoctorId === doctorIdStr;
            
            // Also check if any message involves this doctor
            const involvesDoctor = messages.some(msg => {
              const senderId = normalizeId(msg.senderId);
              const receiverId = normalizeId(msg.receiverId);
              return receiverId === doctorIdStr || senderId === doctorIdStr;
            });
            
            if (keyMatchesDoctor || involvesDoctor) {
                // Get patient name from messages (first message from patient, not from doctor)
                const patientMessages = messages.filter(msg => {
                  const senderId = normalizeId(msg.senderId);
                  return senderId !== doctorIdStr;
                });
                const firstPatientMessage = patientMessages[0];
                const patientName = firstPatientMessage?.senderName || "Patient";
                
                // Get last message for preview
                const lastMessage = messages[messages.length - 1];
                
                // Count unread (messages sent by patient that doctor hasn't seen)
                const unreadCount = messages.filter(msg => {
                  const senderId = normalizeId(msg.senderId);
                  return senderId !== doctorIdStr && !msg.read;
                }).length;
                
                // Use patientId as key to avoid duplicates
                if (!chatMap.has(patientId)) {
                  chatMap.set(patientId, {
                    patientId,
                    patientName,
                    lastMessage,
                    unreadCount,
                    messages,
                    chatKey: key,
                  });
                } else {
                  // Update if this chat has more recent messages
                  const existing = chatMap.get(patientId);
                  const existingLastTime = new Date(existing.lastMessage?.timestamp || 0);
                  const newLastTime = new Date(lastMessage?.timestamp || 0);
                  if (newLastTime > existingLastTime) {
                    chatMap.set(patientId, {
                      patientId,
                      patientName,
                      lastMessage,
                      unreadCount: existing.unreadCount + unreadCount,
                      messages: [...existing.messages, ...messages].sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp)
                      ),
                      chatKey: key,
                    });
                  }
                }
              }
            }
          }
      } catch (e) {
        console.error("Error parsing chat:", key, e);
        // Skip invalid entries
      }
    }
  });
  
  const chatsArray = Array.from(chatMap.values());
  return chatsArray.sort((a, b) => {
    // Sort by last message time (most recent first)
    const timeA = new Date(a.lastMessage?.timestamp || 0);
    const timeB = new Date(b.lastMessage?.timestamp || 0);
    return timeB - timeA;
  });
};

export default function DoctorChatWindow() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Load all chats for this doctor
  useEffect(() => {
    if (user?._id && user?.role === "doctor") {
      const loadChats = () => {
        const doctorChats = getAllDoctorChats(user._id);
        setChats(doctorChats);
      };
      
      loadChats();
      // Refresh chats periodically to catch new messages (every 2 seconds)
      const interval = setInterval(loadChats, 2000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user?._id, user?.role]);
  
  // Also refresh when window gains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?._id && user?.role === "doctor") {
        const doctorChats = getAllDoctorChats(user._id);
        setChats(doctorChats);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?._id, user?.role]);

  // Load messages when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const chatKey = selectedPatient.chatKey;
      const saved = localStorage.getItem(chatKey);
      if (saved) {
        try {
          const loadedMessages = JSON.parse(saved);
          setMessages(loadedMessages);
        } catch (e) {
          console.error("Error loading chat history:", e);
          setMessages([]);
        }
      } else {
        // If no saved chat, try to find it by patient ID
        // The key format is: chat_patientId_doctorId
        const alternativeKey = `chat_${selectedPatient.patientId}_${user._id}`;
        const altSaved = localStorage.getItem(alternativeKey);
        if (altSaved) {
          try {
            const loadedMessages = JSON.parse(altSaved);
            setMessages(loadedMessages);
            // Update the selected patient with the correct key
            setSelectedPatient({ ...selectedPatient, chatKey: alternativeKey });
          } catch (e) {
            console.error("Error loading chat history:", e);
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
    } else {
      setMessages([]);
    }
  }, [selectedPatient, user._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages when they change
  useEffect(() => {
    if (selectedPatient && selectedPatient.chatKey && messages.length > 0 && user?._id) {
      try {
        localStorage.setItem(selectedPatient.chatKey, JSON.stringify(messages));
        // Refresh chats list
        const doctorChats = getAllDoctorChats(user._id);
        setChats(doctorChats);
      } catch (e) {
        console.error("Error saving messages:", e);
      }
    }
  }, [messages, selectedPatient, user?._id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedPatient || !user?._id) return;

    const message = {
      id: Date.now().toString(),
      senderId: user._id,
      senderName: user.name,
      receiverId: selectedPatient.patientId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true, // Doctor's own messages are read
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage("");
    
    // Save to localStorage immediately
    if (selectedPatient.chatKey) {
      localStorage.setItem(selectedPatient.chatKey, JSON.stringify(updatedMessages));
    }
    
    // Also update the chat in the chats list
    const updatedChats = chats.map((chat) => {
      if (chat.patientId === selectedPatient.patientId) {
        return {
          ...chat,
          lastMessage: message,
          messages: updatedMessages,
        };
      }
      return chat;
    });
    setChats(updatedChats);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectChat = (chat) => {
    setSelectedPatient(chat);
    // Mark patient messages as read (doctor is viewing them)
    const updatedMessages = chat.messages.map(msg => {
      const normalizeId = (id) => {
        if (!id) return null;
        return typeof id === 'object' ? id.toString() : String(id);
      };
      const senderId = normalizeId(msg.senderId);
      const doctorIdStr = normalizeId(user._id);
      
      // If message is from patient (not doctor), mark as read
      if (senderId !== doctorIdStr) {
        return { ...msg, read: true };
      }
      return msg;
    });
    localStorage.setItem(chat.chatKey, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
  };

  if (!user || user.role !== "doctor") return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition z-40"
          title="Open messages"
        >
          <MessageCircle size={24} />
          {chats.some(chat => chat.unreadCount > 0) && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 w-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-50 ${
            isMinimized ? "h-14" : "h-[600px]"
          } transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-blue-600 dark:bg-blue-700 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Users className="text-white" size={20} />
              <h3 className="text-white font-semibold">
                {selectedPatient ? `Chat with ${selectedPatient.patientName}` : `Patient Messages (${chats.length})`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedPatient && (
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-white hover:text-gray-200 transition text-sm px-2 py-1"
                  title="Back to list"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200 transition"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {!selectedPatient ? (
                /* Chat List */
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900">
                  {chats.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-slate-400 text-sm py-8">
                      No messages from patients yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chats.map((chat) => (
                        <button
                          key={chat.chatKey}
                          onClick={() => selectChat(chat)}
                          className="w-full text-left bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-slate-50">
                                {chat.patientName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-slate-400 truncate mt-1">
                                {chat.lastMessage?.text || "No messages"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-2">
                              {chat.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {chat.unreadCount}
                                </span>
                              )}
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                {chat.lastMessage?.timestamp
                                  ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Chat Messages */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-slate-400 text-sm py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        // Normalize IDs for comparison
                        const normalizeId = (id) => {
                          if (!id) return null;
                          return typeof id === 'object' ? id.toString() : String(id);
                        };
                        const isOwn = normalizeId(msg.senderId) === normalizeId(user._id);
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                isOwn
                                  ? "bg-blue-600 text-white"
                                  : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 border border-gray-200 dark:border-slate-600"
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1 opacity-80">
                                  {msg.senderName}
                                </p>
                              )}
                              <p className="text-sm">{msg.text}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn
                                    ? "text-blue-100"
                                    : "text-gray-500 dark:text-slate-400"
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-50 placeholder-gray-400 dark:placeholder-slate-400"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

