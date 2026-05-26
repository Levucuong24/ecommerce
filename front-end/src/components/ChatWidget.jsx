import { useState, useEffect, useRef } from "react";
import { getAuthToken } from "../utils/authStorage";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ChatWidget({ activeStore, onClose, currentUser }) {
  const [currentStore, setCurrentStore] = useState(activeStore);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const messagesEndRef = useRef(null);

  // Sync currentStore with activeStore prop
  useEffect(() => {
    if (activeStore) {
      setCurrentStore(activeStore);
      setIsMinimized(false);
    } else {
      setCurrentStore(null);
    }
  }, [activeStore]);

  const fetchMessages = async (showLoading = false) => {
    if (!currentStore || !currentUser) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/chats/${currentStore.id || currentStore._id || currentStore.storeId}`, {
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

  const fetchUserConversations = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${apiUrl}/chats/conversations/user`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử chat:", error);
    }
  };

  // Poll for messages in active chat
  useEffect(() => {
    if (!currentStore || isMinimized || !currentUser || currentUser.role !== "customer") return;
    
    fetchMessages(true);
    
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStore, isMinimized, currentUser]);

  // Poll for conversation list when not in active chat
  useEffect(() => {
    if (!currentUser || currentUser.role !== "customer") return;
    if (currentStore || isMinimized) return;

    setLoadingConversations(true);
    fetchUserConversations().finally(() => setLoadingConversations(false));

    const interval = setInterval(() => {
      fetchUserConversations();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentStore, isMinimized, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStore]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentStore || !currentUser) return;

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
          storeId: currentStore.id || currentStore._id || currentStore.storeId,
          content: text,
          receiverId: currentStore.ownerId || currentStore.storeOwnerId,
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

  const handleBack = () => {
    setCurrentStore(null);
    if (onClose) onClose();
  };

  const handleSelectConversation = (conv) => {
    setCurrentStore({
      id: conv.storeId,
      ownerId: conv.storeOwnerId,
      name: conv.storeName,
      logo: conv.storeLogo,
    });
    setMessages([]);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // difference in minutes
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  };

  if (!currentUser || currentUser.role !== "customer") return null;

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
        <span>{currentStore ? `Chat với ${currentStore.name}` : "Chat"}</span>
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
        {currentStore ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              onClick={handleBack}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
                padding: "0 4px",
                display: "flex",
                alignItems: "center",
              }}
              title="Quay lại danh sách"
            >
              ←
            </button>
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
              {currentStore.logo ? (
                <img src={currentStore.logo} alt={currentStore.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>{currentStore.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <span style={{ fontSize: "15px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>
              {currentStore.name}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>💬</span>
            <span style={{ fontSize: "15px" }}>Lịch sử chat</span>
          </div>
        )}
        
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
            onClick={() => {
              setIsMinimized(true);
              if (onClose) onClose();
            }}
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

      {/* Main Body */}
      {currentStore ? (
        <>
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
        </>
      ) : (
        /* Conversation List Mode */
        <div 
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loadingConversations && conversations.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", marginTop: "40px", fontSize: "14px" }}>
              Đang tải lịch sử chat...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "60px", padding: "0 20px", fontSize: "14px" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "10px" }}>💬</span>
              Bạn chưa trò chuyện với cửa hàng nào.
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.storeId}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "background 0.2s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff5f5";
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* Store Logo */}
                <div 
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    color: "var(--shopee-red, #ee4d2d)",
                    border: "1px solid #e2e8f0",
                    flexShrink: 0,
                  }}
                >
                  {conv.storeLogo ? (
                    <img src={conv.storeLogo} alt={conv.storeName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{conv.storeName[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginRight: "10px" }}>
                      {conv.storeName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", flexShrink: 0 }}>
                      {formatTime(conv.lastMessageAt)}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: conv.senderRole === "staff" ? "var(--shopee-red, #ee4d2d)" : "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {conv.senderRole === "staff" ? `Shop: ${conv.lastMessage}` : conv.lastMessage}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
