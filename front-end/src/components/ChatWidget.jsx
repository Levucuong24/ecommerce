import { useState, useEffect, useRef } from "react";
import { getAuthToken } from "../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ChatWidget({ activeStore, onClose, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (showLoading = false) => {
    if (!activeStore || !currentUser) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/chats/${activeStore.id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeStore || isMinimized) return;
    
    fetchMessages(true);
    
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeStore, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeStore || !currentUser) return;

    const text = inputText;
    setInputText("");

    try {
      const response = await fetch(`${apiUrl}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          storeId: activeStore.id,
          content: text,
          receiverId: activeStore.ownerId,
          senderRole: "customer",
        }),
      });

      if (response.ok) {
        fetchMessages(false);
      } else {
        console.error("Gửi tin nhắn thất bại");
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  if (!activeStore || !currentUser) return null;

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "var(--shopee-red, #ee4d2d)",
          color: "white",
          padding: "12px 24px",
          borderRadius: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "600",
          fontFamily: "var(--font-family, sans-serif)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <span style={{ fontSize: "18px" }}>💬</span>
        <span>Chat với {activeStore.name}</span>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "360px",
        height: "460px",
        background: "white",
        borderRadius: "12px 12px 0 0",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        fontFamily: "var(--font-family, sans-serif)",
      }}
    >
      {/* Header */}
      <div 
        style={{
          background: "var(--shopee-red, #ee4d2d)",
          color: "white",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: "600",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div 
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "#666"
            }}
          >
            {activeStore.logo ? (
              <img src={activeStore.logo} alt={activeStore.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span>{activeStore.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <span style={{ fontSize: "15px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "180px" }}>
            {activeStore.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={() => setIsMinimized(true)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              padding: 0,
              lineHeight: 1,
            }}
          >
            _
          </button>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: "40px", fontSize: "14px" }}>
            Đang tải tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px", fontSize: "13px", padding: "0 20px" }}>
            Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện với shop!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderRole === "customer";
            return (
              <div 
                key={msg._id || index}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div 
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    background: isMe ? "var(--shopee-red, #ee4d2d)" : "white",
                    color: isMe ? "white" : "#1e293b",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: "12px",
          borderTop: "1px solid #e2e8f0",
          background: "white",
          display: "flex",
          gap: "8px",
        }}
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button 
          type="submit"
          style={{
            background: "var(--shopee-red, #ee4d2d)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Gửi
        </button>
      </form>
    </div>
  );
}

export default ChatWidget;
