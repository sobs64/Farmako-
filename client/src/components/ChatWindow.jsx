import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function ChatWindow({ doctorId, doctorName }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Normalize ID for comparison
  const normalizeId = (id) => {
    if (!id) return null;
    return typeof id === 'object' ? id.toString() : String(id);
  };

  // Load chat history from localStorage
  useEffect(() => {
    if (doctorId && user?._id) {
      try {
        // Use consistent key format: chat_patientId_doctorId
        const chatKey = `chat_${normalizeId(user._id)}_${normalizeId(doctorId)}`;
        const saved = localStorage.getItem(chatKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed || []);
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
        setMessages([]);
      }
    }
  }, [doctorId, user?._id]);

  // Save messages to localStorage
  useEffect(() => {
    if (doctorId && user?._id && messages.length > 0) {
      try {
        // Use consistent key format: chat_patientId_doctorId
        const chatKey = `chat_${normalizeId(user._id)}_${normalizeId(doctorId)}`;
        const messagesWithRead = messages.map(msg => ({
          ...msg,
          read: normalizeId(msg.senderId) === normalizeId(user._id) ? true : (msg.read || false), // Mark own messages as read
        }));
        localStorage.setItem(chatKey, JSON.stringify(messagesWithRead));
      } catch (e) {
        console.error("Error saving messages:", e);
      }
    }
  }, [messages, doctorId, user?._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !doctorId || !user?._id) return;

    const message = {
      id: Date.now().toString(),
      senderId: user._id,
      senderName: user.name || "Patient",
      receiverId: doctorId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false, // Doctor hasn't read it yet
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!doctorId || !user) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition z-40"
          title="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-50 ${
            isMinimized ? "h-14" : "h-[500px]"
          } transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-blue-600 dark:bg-blue-700 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-white" size={20} />
              <h3 className="text-white font-semibold">
                Chat with {doctorName || "Doctor"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200 transition"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 size={18} />
                ) : (
                  <Minimize2 size={18} />
                )}
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

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-slate-400 text-sm py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    // Normalize IDs for comparison
                    const isOwn = normalizeId(msg.senderId) === normalizeId(user._id);
                    return (
                      <div
                        key={msg.id || Date.now()}
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
                              {msg.senderName || "Unknown"}
                            </p>
                          )}
                          <p className="text-sm">{msg.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-blue-100" : "text-gray-500 dark:text-slate-400"
                            }`}
                          >
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                        Doctor is typing...
                      </p>
                    </div>
                  </div>
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
        </div>
      )}
    </>
  );
}

