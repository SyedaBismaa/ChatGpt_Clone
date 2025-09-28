import React, { useCallback, useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chats/ChatMobileBar.jsx';
import ChatSidebar from '../components/chats/ChatSidebar.jsx';
import ChatMessages from '../components/chats/ChatMessages.jsx';
import ChatComposer from '../components/chats/ChatComposer.jsx';
import '../components/chats/ChatLayout.css';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats
} from '../store/chatSlice.js';

const BACKEND_URL = "https://chatgpt-clone-2-pqtt.onrender.com";

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const [messages, setMessages] = useState([]);

  // DEBUG: Check cookies and headers
  const debugCookiesAndRequest = () => {
    const allCookies = document.cookie;
    const tokenMatch = allCookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : 'No token found';
    
    console.log("=== DEBUG INFO ===");
    console.log("All cookies:", allCookies);
    console.log("Token from cookie:", token);
    console.log("Domain:", window.location.hostname);
    console.log("Current URL:", window.location.href);
    
    setDebugInfo(`Token: ${token.substring(0, 50)}...`);
  };

  const handleNewChat = async () => {
    if (!isLoggedIn) {
      alert('Please log in first');
      return;
    }

    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) title = title.trim();
    if (!title) return;

    try {
      debugCookiesAndRequest();
      
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        title
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("New chat created:", response.data);
      getMessages(response.data.chat._id);
      dispatch(startNewChat(response.data.chat));
      setSidebarOpen(false);
    } catch (error) {
      console.error("Error creating new chat:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 400 && error.response?.data?.message === 'Unauthorized') {
        alert('Your session has expired. Please log in again.');
        setIsLoggedIn(false);
      } else {
        alert('Failed to create new chat. Please try again.');
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        debugCookiesAndRequest();
        
        console.log("Making initial request with credentials...");
        
        // Try with explicit headers
        const testResponse = await axios.get(`${BACKEND_URL}/api/chat`, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (cancelled) return;
        
        console.log("✅ Authentication successful!");
        console.log("Response:", testResponse.data);
        
        setIsLoggedIn(true);
        dispatch(setChats(testResponse.data.chats.reverse()));

        // Initialize socket only after successful auth
        const tempSocket = io(BACKEND_URL, {
          withCredentials: true,
          transports: ["websocket", "polling"],
          autoConnect: true
        });

        tempSocket.on("connect", () => {
          console.log("✅ Socket connected:", tempSocket.id);
        });

        tempSocket.on("disconnect", () => {
          console.log("❌ Socket disconnected");
        });

        tempSocket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
        });

        tempSocket.on("ai-response", (messagePayload) => {
          console.log("📨 Received AI response:", messagePayload);
          
          if (messagePayload.chat === activeChatId) {
            setMessages((prevMessages) => [...prevMessages, {
              type: 'ai',
              content: messagePayload.content
            }]);
            dispatch(sendingFinished());
          }
        });

        tempSocket.on("ai-error", (errorPayload) => {
          console.error("❌ AI Error:", errorPayload);
          setMessages((prevMessages) => [...prevMessages, {
            type: 'ai',
            content: errorPayload.message || 'Error generating response'
          }]);
          dispatch(sendingFinished());
        });

        if (!cancelled) {
          setSocket(tempSocket);
        }

      } catch (error) {
        if (!cancelled) {
          console.error("❌ Initialization error:", error);
          console.error("❌ Error response:", error.response?.data);
          console.error("❌ Error status:", error.response?.status);
          console.error("❌ Error headers:", error.response?.headers);
          
          if (error.response?.status === 400) {
            console.error("❌ 400 Error - likely authentication issue");
            setIsLoggedIn(false);
          }
          
          setDebugInfo(`Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [activeChatId, dispatch]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    console.log("📤 Sending message:", trimmed);
    
    if (!trimmed || !activeChatId || isSending || !isLoggedIn) return;
    
    dispatch(sendingStarted());

    const newMessages = [...messages, {
      type: 'user',
      content: trimmed
    }];

    setMessages(newMessages);
    dispatch(setInput(''));

    if (socket && socket.connected) {
      socket.emit("join-chat", activeChatId);
      socket.emit("ai-message", {
        chat: activeChatId,
        content: trimmed
      });
    } else {
      console.error("❌ Socket not connected");
      dispatch(sendingFinished());
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Connection error. Please try again.'
      }]);
    }
  };

  const getMessages = async (chatId) => {
    if (!isLoggedIn) return;

    try {
      console.log("📥 Fetching messages for chat:", chatId);
      
      const response = await axios.get(`${BACKEND_URL}/api/chat/messages/${chatId}`, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Fetched messages:", response.data.messages);

      setMessages(response.data.messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));

      if (socket && socket.connected) {
        socket.emit("join-chat", chatId);
      }

    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      if (error.response?.status === 400) {
        setIsLoggedIn(false);
      }
    }
  };

  // Show login prompt if not authenticated
  if (isLoggedIn === false) {
    return (
      <div className="chat-layout minimal">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2>Authentication Required</h2>
          <p>You need to be logged in to access the chat.</p>
          <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#666' }}>
            Debug: {debugInfo}
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '0.5rem 1rem',
              marginTop: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
          <button 
            onClick={debugCookiesAndRequest}
            style={{
              padding: '0.5rem 1rem',
              marginTop: '0.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Debug Cookies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {/* Debug info */}
        <div style={{ 
          padding: '0.5rem', 
          backgroundColor: '#f8f9fa', 
          fontSize: '0.8rem',
          borderBottom: '1px solid #dee2e6'
        }}>
          <strong>Debug:</strong> {debugInfo}
          <button 
            onClick={debugCookiesAndRequest}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Refresh Debug
          </button>
        </div>

        {/* Login status */}
        {isLoggedIn !== null && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
            <span style={{ 
              backgroundColor: isLoggedIn ? '#28a745' : '#dc3545',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}>
              {isLoggedIn ? "✅ Logged In" : "❌ Not Logged In"}
            </span>
          </div>
        )}
        
        {messages.length === 0 && isLoggedIn && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>ChatGPT Clone</h1>
            <p>Ask anything. Paste text, brainstorm ideas, or get quick explanations. Your chats stay in the sidebar so you can pick up where you left off.</p>
          </div>
        )}
        
        {isLoggedIn && <ChatMessages messages={messages} isSending={isSending} />}
        
        {activeChatId && isLoggedIn && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;