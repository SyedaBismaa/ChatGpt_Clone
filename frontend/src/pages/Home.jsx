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
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // --- Axios interceptors for debugging ---
  useEffect(() => {
    axios.interceptors.request.use(req => {
      console.log("[Axios Request]", req.method, req.url, req.data || "");
      return req;
    });

    axios.interceptors.response.use(
      res => {
        console.log("[Axios Response]", res.status, res.data);
        return res;
      },
      err => {
        console.error("[Axios Error]", err.response?.status, err.response?.data);
        return Promise.reject(err);
      }
    );
  }, []);

  // --- Check login status ---
  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log("[Login Check] GET /api/chat");
        await axios.get(`${BACKEND_URL}/api/chat`, { withCredentials: true });
        setIsLoggedIn(true);
      } catch (err) {
        console.error("[Login Error]", err.response?.data);
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  // --- Fetch chats and initialize socket ---
  useEffect(() => {
    const fetchChatsAndInitSocket = async () => {
      try {
        console.log("[Fetch Chats] GET /api/chat");
        const response = await axios.get(`${BACKEND_URL}/api/chat`, { withCredentials: true });
        dispatch(setChats(response.data.chats.reverse()));
      } catch (err) {
        console.error("[Fetch Chats Error]", err.response?.data);
      }

      // Initialize socket
      const tempSocket = io(BACKEND_URL, {
        transports: ["websocket"],
        withCredentials: true
      });

      tempSocket.on("connect", () => console.log("[Socket Connected]", tempSocket.id));
      tempSocket.on("disconnect", () => console.log("[Socket Disconnected]"));
      tempSocket.on("ai-response", (messagePayload) => {
        console.log("[Socket AI Response]", messagePayload);
        if (messagePayload.chat === activeChatId) {
          setMessages(prev => [...prev, { type: 'ai', content: messagePayload.content }]);
          dispatch(sendingFinished());
        }
      });
      tempSocket.on("ai-error", (err) => {
        console.error("[Socket AI Error]", err);
        if (activeChatId) {
          setMessages(prev => [...prev, { type: 'ai', content: err.message }]);
          dispatch(sendingFinished());
        }
      });

      setSocket(tempSocket);

      return () => tempSocket.disconnect();
    };

    fetchChatsAndInitSocket();
  }, [activeChatId, dispatch]);

  // --- Send message ---
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;

    dispatch(sendingStarted());
    setMessages(prev => [...prev, { type: 'user', content: trimmed }]);
    dispatch(setInput(''));

    if (socket) {
      console.log("[Socket Emit] join-chat", activeChatId);
      socket.emit("join-chat", activeChatId);

      console.log("[Socket Emit] ai-message", { chat: activeChatId, content: trimmed });
      socket.emit("ai-message", { chat: activeChatId, content: trimmed });
    }
  };

  // --- Fetch messages ---
  const getMessages = async (chatId) => {
    try {
      console.log("[Fetch Messages] GET /api/chat/messages/" + chatId);
      const response = await axios.get(`${BACKEND_URL}/api/chat/messages/${chatId}`, { withCredentials: true });
      setMessages(response.data.messages.map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));
      if (socket) socket.emit("join-chat", chatId);
    } catch (err) {
      console.error("[Fetch Messages Error]", err.response?.data);
    }
  };

  // --- Handle new chat ---
  const handleNewChat = async () => {
    let title = window.prompt('Enter a title for the new chat:', '');
    if (!title || !(title = title.trim())) return;

    try {
      console.log("[Create Chat] POST /api/chat", { title });
      const response = await axios.post(`${BACKEND_URL}/api/chat`, { title }, { withCredentials: true });
      dispatch(startNewChat(response.data.chat));
      getMessages(response.data.chat._id);
      if (socket) socket.emit("join-chat", response.data.chat._id);
      setSidebarOpen(false);
    } catch (err) {
      console.error("[Create Chat Error]", err.response?.data);
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
          setMessages([]);
          setSidebarOpen(false);
          getMessages(id);
          if (socket) socket.emit("join-chat", id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {isLoggedIn !== null && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
            <button className="small-btn" onClick={() => { if (!isLoggedIn) window.location.href = '/login'; }}>
              {isLoggedIn ? "Logged In" : "Not Logged In"}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>Konvox ━ Your AI homie</h1>
            <p>Ask anything. Paste text, brainstorm ideas, or get quick explanations.
              Your chats stay in the sidebar so you can pick up where you left off.</p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default Home;
