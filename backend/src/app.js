const express = require('express');
const cookieParser = require('cookie-parser')

//auth routes
const authRoutes = require('./routes/auth.route')
//chat routes
const chatRoutes = require('./routes/chat.route')
const cors = require('cors');

const app = express();

//middelwares
app.use(express.json())
app.use(cookieParser())

// FIXED: Updated CORS configuration for cross-origin cookies
app.use(cors({
  origin: [
    "http://localhost:5173",    // Your dev frontend
    "https://chat-gpt-clone-eta-silk.vercel.app"    // If you ever use HTTPS locally
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,              // This enables cookies
  allowedHeaders: ["Content-Type", "Authorization"], // Allow standard headers
  optionsSuccessStatus: 200       // For legacy browser support
}));

//using routes 
app.use('/api/auth',authRoutes);
app.use('/api/chat',chatRoutes)

module.exports=app;