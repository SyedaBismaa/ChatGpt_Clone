const chatModel = require('../models/chat.models')


async function createChat(req,res) {
    
    const {title} = req.body;
    
    const user = req.user;

    const chat = await chatModel.create({
        user:user._id,
        title
    });

    res.status(201).json({
        message:"chat Created Successfully!",
        chat:{
            _id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity,
            user:chat.user
        }
    })

}



module.exports={createChat};