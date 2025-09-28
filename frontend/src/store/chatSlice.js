import { createSlice, nanoid } from '@reduxjs/toolkit';

// helpers
const createEmptyChat = (title) => ({ 
    id: nanoid(), 
    title: title || 'New Chat', 
    messages: [] 
});

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: [],
        activeChatId: null,
        isSending: false,
        input: ''
    },
    reducers: {
        ensureInitialChat(state) {
            if (state.chats.length === 0) {
                const chat = createEmptyChat();
                state.chats.unshift(chat);
                state.activeChatId = chat.id;
            }
        },
        startNewChat: {
            reducer(state, action) {
                // FIXED: Normalize backend _id to id for consistency
                const { _id, title } = action.payload;
                const newChat = { 
                    id: _id,  // Use _id from backend as id
                    title: title || 'New Chat', 
                    messages: [] 
                };
                state.chats.unshift(newChat);
                state.activeChatId = _id;
            }
        },
        selectChat(state, action) {
            state.activeChatId = action.payload;
        },
        setInput(state, action) {
            state.input = action.payload;
        },
        sendingStarted(state) {
            state.isSending = true;
        },
        sendingFinished(state) {
            state.isSending = false;
        },
        setChats(state, action) {
            // FIXED: Normalize all chats to use 'id' consistently
            state.chats = action.payload.map(chat => ({
                ...chat,
                id: chat._id || chat.id  // Use _id from backend as id
            }));
            
            // Set first chat as active if none is selected
            if (state.chats.length > 0 && !state.activeChatId) {
                state.activeChatId = state.chats[0].id;
            }
        },
        addUserMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c.id === chatId);
                if (!chat) return;
                if (chat.messages.length === 0) {
                    chat.title = message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '');
                }
                chat.messages.push(message);
            },
            prepare(chatId, content) {
                return { 
                    payload: { 
                        chatId, 
                        message: { 
                            id: nanoid(), 
                            role: 'user', 
                            content, 
                            ts: Date.now() 
                        } 
                    } 
                };
            }
        },
        addAIMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c.id === chatId);
                if (!chat) return;
                chat.messages.push(message);
            },
            prepare(chatId, content, error = false) {
                return { 
                    payload: { 
                        chatId, 
                        message: { 
                            id: nanoid(), 
                            role: 'ai', 
                            content, 
                            ts: Date.now(), 
                            ...(error ? { error: true } : {}) 
                        } 
                    } 
                };
            }
        }
    }
});

export const {
    ensureInitialChat,
    startNewChat,
    selectChat,
    setInput,
    sendingStarted,
    sendingFinished,
    addUserMessage,
    addAIMessage,
    setChats
} = chatSlice.actions;

export default chatSlice.reducer;