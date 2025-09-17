const { Server } = require("socket.io");
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.models')
const aiService = require('../services/ai.services')
const messageModel = require('../models/message.models')
const { createMemory, queryMemory } = require('../services/vector.services')

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

            const [message, vectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    content: messagePayload.content,
                    role: "user"
                }),
                aiService.generateVector(messagePayload.content),
               
            ])
              
            await  createMemory({
                    vectors,
                    messageId: message._id,
                    metadata: {
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        text: messagePayload.content
                    }
                })
  
            const [memory,chatHistory] = await Promise.all([
              queryMemory({
                queryVector: vectors,
                limit: 3,
                metadata: {
                    user: socket.user._id
                }
            }),
            messageModel.find({
                chat:messagePayload.chat
            }).sort({ createdAt: -1 }).limit(20).lean().then(messages => messages.reverse())

            ])


            const stm = chatHistory.map(item => {
                return {
                    role: item.role,
                    parts: [{ text: item.content }]
                }
            });

            const ltm = [
                {
                    role: "user",
                    parts: [{
                        text: `
                        these are some previous messages from the chat, use them to generate response

                        ${memory.map(item => item.metadata.text).join("\n")}
                        `
                    }]
                }
            ]

            console.log(ltm[0]);
            console.log(stm);



            const response = await aiService.generateResponse([...ltm, ...stm])

            /*
            const responseMessage = await messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: response,
                role: "model"
            })

            const responseVectors = await aiService.generateVector(response)

             */

             socket.emit('ai-response', {
                content: response,
                chat: messagePayload.chat
            })

            const [ responseMessage, responseVectors] = await Promise.all([
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
         

           
        })

    })
}



module.exports = initSocketServer;