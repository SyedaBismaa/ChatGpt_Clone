
const express = require('express');
const cookieParser = require('cookie-parser')

//auth routes
const authRoutes = require('./routes/auth.route')
//chat routes
const chatRoutes = require('./routes/chat.route')

const app = express();

//middelwares
app.use(express.json())
app.use(cookieParser())






//using routes 
app.use('/api/auth',authRoutes);
app.use('/api/chat',chatRoutes)



module.exports=app;