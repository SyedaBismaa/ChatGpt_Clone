const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.models')
const aiService = require('../services/ai.services')
const messageModel = require('../models/message.models')
const { createMemory, queryMemory } = require('../services/vector.services')

function initSocketServer(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        }
    })

    // 🔐 Middleware: authenticate socket connection using cookie token
    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

        if (!cookies.token) {
            return next(new Error("Authentication Error: Token Not provided"))
        }
        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user; // attach user to socket for later use
            next();
        } catch {
            next(new Error("Authentication Error: Invalid token"));
        }
    })

    io.on("connection", (socket) => {
        console.log("✅ User connected:", socket.user?._id)

        /**
         * 🆕 Add a join-chat event:
         * Client calls this with a chatId to join a room
         */
        socket.on("join-chat", (chatId) => {
            socket.join(chatId); // join the socket.io room
            console.log(`📌 User ${socket.user._id} joined chat room ${chatId}`);
        });

        /**
         * Handle user messages sent to AI
         */
        socket.on("ai-message", async (messagePayload) => {
            console.log("📩 Incoming user message:", messagePayload);

            try {
                // Save user message + vector
                const [message, vectors] = await Promise.all([
                    messageModel.create({
                        chat: messagePayload.chat,
                        content: messagePayload.content,
                        role: "user"
                    }),
                    aiService.generateVector(messagePayload.content),
                ])

                await createMemory({
                    vectors,
                    messageId: message._id,
                    metadata: {
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        text: messagePayload.content
                    }
                })

                // Retrieve memory + chat history
                const [memory, chatHistory] = await Promise.all([
                    queryMemory({
                        queryVector: vectors,
                        limit: 3,
                        metadata: { user: socket.user._id }
                    }),
                    messageModel.find({ chat: messagePayload.chat })
                        .sort({ createdAt: -1 })
                        .limit(20)
                        .lean()
                        .then(messages => messages.reverse())
                ])

                // Format messages for AI
                const stm = chatHistory.map(item => ({
                    role: item.role,
                    parts: [{ text: item.content }]
                }));

                const ltm = [{
                    role: "user",
                    parts: [{
                        text: `
                        These are some previous messages from the chat, use them to generate response:
                        ${memory.map(item => item.metadata.text).join("\n")}
                        `
                    }]
                }]

                // ⚠️ Check if socket is still connected before heavy AI call
                if (!socket.connected) {
                    await messageModel.create({
                        chat: messagePayload.chat,
                        content: "⚠️ AI response could not be generated (user disconnected)",
                        role: "model"
                    });
                    return;
                }

                // Generate AI response
                const response = await aiService.generateResponse([...ltm, ...stm])

                // ✅ Emit to the whole chat room (not just this socket!)
                io.to(messagePayload.chat).emit("ai-response", {
                    content: response,
                    chat: messagePayload.chat
                });

                // Save AI response + vector
                const [responseMessage, responseVectors] = await Promise.all([
                    messageModel.create({
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        content: response,
                        role: "model"
                    }),
                    aiService.generateVector(response)
                ])

                await createMemory({
                    vectors: responseVectors,
                    messageId: responseMessage._id,
                    metadata: {
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        text: response
                    }
                })

            } catch (err) {
                console.error("❌ Error handling ai-message:", err.message);

                // Log error in DB for traceability
                await messageModel.create({
                    chat: messagePayload.chat,
                    content: "⚠️ Sorry, something went wrong while generating AI response.",
                    role: "model"
                });

                // Don’t emit error message directly to socket (PR decision),
                // but you *could* notify frontend with a clean error event:
                socket.emit("ai-error", { message: "AI failed to generate a response." });
            }
        })
    })
}

module.exports = initSocketServer;
