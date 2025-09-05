const mongoose = require('mongoose')


async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Connected To DB");
    }catch (err){
        console.log("Error in Connecting:", err);
        
    }
}


module.exports=connectDB;