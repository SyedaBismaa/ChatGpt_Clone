import React, { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import ChatMobileBar from '../components/chats/ChatMobileBar.jsx';
import ChatSidebar from '../components/chats/ChatSidebar.jsx';
import ChatMessages from '../components/chats/ChatMessages.jsx';
import ChatComposer from '../components/chats/ChatComposer.jsx';
import '../components/chats/ChatLayout.css';
import {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats
} from '../store/chatSlice.js';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = unknown

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // --- Check login status once on mount ---
  useEffect(() => {
    const checkLogin = async () => {
      try {
        await axios.get("http://localhost:3000/api/chat", { withCredentials: true });
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false,err);
      }
    };
    checkLogin();
  }, []);

  // --- Fetch chats and initialize socket ---
  useEffect(() => {
    // Load existing chats from backend
    axios.get("http://localhost:3000/api/chat", { withCredentials: true })
      .then(response => {
        dispatch(setChats(response.data.chats.reverse()));
      })
      .catch(console.error);

    // Connect socket
    const tempSocket = io("http://localhost:3000", { withCredentials: true });

    // Handle AI response
    tempSocket.on("ai-response", (messagePayload) => {
      // ✅ Only update if the response belongs to the active chat
      if (messagePayload.chat === activeChatId) {
        setMessages(prev => [...prev, { type: 'ai', content: messagePayload.content }]);
        dispatch(sendingFinished());
      }
    });

    // Handle AI error events (optional, but good UX)
    tempSocket.on("ai-error", (err) => {
      if (activeChatId) {
        setMessages(prev => [...prev, { type: 'ai', content: err.message }]);
        dispatch(sendingFinished()); // stop spinner
      }
    });

    setSocket(tempSocket);

    return () => {
      tempSocket.disconnect();
    };
  }, [activeChatId]); 
  // 🔑 dependency ensures socket handlers know which chat is active

  // --- Send message ---
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;

    dispatch(sendingStarted());

    // Add user message to local state immediately
    const newMessages = [...messages, { type: 'user', content: trimmed }];
    setMessages(newMessages);
    dispatch(setInput(''));

    // ✅ Join the active chat room before sending
    socket.emit("join-chat", activeChatId);

    // Send message to backend
    socket.emit("ai-message", { chat: activeChatId, content: trimmed });
  };

  // --- Fetch messages for a given chat ---
  const getMessages = async (chatId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/chat/messages/${chatId}`, { withCredentials: true });
      setMessages(response.data.messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));

      // ✅ Join the room for this chat
      if (socket) {
        socket.emit("join-chat", chatId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Handle new chat creation ---
  const handleNewChat = async () => {
    let title = window.prompt('Enter a title for the new chat:', '');
    if (!title || !(title = title.trim())) return;

    try {
      const response = await axios.post("http://localhost:3000/api/chat", { title }, { withCredentials: true });
      dispatch(startNewChat(response.data.chat));

      // Load initial messages for new chat
      getMessages(response.data.chat._id);

      // ✅ Join the new chat room
      if (socket) {
        socket.emit("join-chat", response.data.chat._id);
      }

      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

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

          // ✅ Join chat room when switching
          if (socket) {
            socket.emit("join-chat", id);
          }
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />

      <main className="chat-main" role="main">
        {/* --- Login Button --- */}
        {isLoggedIn !== null && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
            <button
              className="small-btn"
              onClick={() => {
                if (!isLoggedIn) window.location.href = '/login';
              }}
            >
              {isLoggedIn ? "Logged In" : "Not Logged In"}
            </button>
          </div>
        )}

        {/* --- Welcome / Empty State --- */}
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>Konvox ━ Your AI homie</h1>
            <p>Ask anything. Paste text, brainstorm ideas, or get quick explanations. 
               Your chats stay in the sidebar so you can pick up where you left off.</p>
          </div>
        )}

        {/* --- Messages --- */}
        <ChatMessages messages={messages} isSending={isSending} />

        {/* --- Composer --- */}
        {activeChatId && (
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
