const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.models')
const aiService = require('../services/ai.services')
const messageModel = require('../models/message.models')
const {createMemory , queryMemory} = require('../services/vector.services')


function initSocketServer(httpServer) {

    const io = new Server(httpServer, {});

    io.use(async (socket, next) => {

        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

        if (!cookies.token) {
            next(new Error("Authentication Error:Token Not provided"))
        }
        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user = await userModel.findById(decoded.id);

            socket.user = user;
            next();

        } catch {
            next(new Error("Authentication Error:Invalid token"));
        }

    })

    io.on("connection", (socket) => {


        socket.on("ai-message", async (messagePayload) => {

            console.log(messagePayload);

            await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: messagePayload.content,
                role: "user"
            })

            //long-term-memory
             const vectors = await aiService.generateVector(messagePayload.content)
             //saved in vector database pinecone
             await createMemory({
                vectors,
                messageId:"46879998",
                metadata:{
                    chat:messagePayload.chat,
                    user:socket.user._id
                }
             })
             


            const chatHistory = (await messageModel.find({ chat: messagePayload.chat }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

            const response = await aiService.generateResponse(chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            }))


            await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: response,
                role: "model"
            })



            socket.emit('ai-response', {
                content: response,
                chat: messagePayload.chat
            })
        })

    })
}



module.exports = initSocketServer;