
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
app.use(cors({
  origin: "http://localhost:5173",   // yaha apna frontend ka URL dalna
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));






//using routes 
app.use('/api/auth',authRoutes);
app.use('/api/chat',chatRoutes)



module.exports=app;