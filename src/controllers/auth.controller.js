const userModel= require('../models/user.models')
const bcrypt=require('bcryptjs'); //hash password
const jwt = require('jsonwebtoken'); //authenticate after hash password



//register controller

async function registerUser(req,res) {
    
    const {fullName:{firstName,lastName},email,password} = req.body;

    const isUserAlreadyExist = await userModel.findOne({ email});

    if(isUserAlreadyExist){
        return res.status(400).json({message:"User Already Exist"})
    }


    const hashPassword = await bcrypt.hash(password,10);

    const user = await userModel.create({
        fullName:{
            firstName,lastName,
        },
        email,
        password:hashPassword,
    })

    const token = jwt.sign({  id:user._id}, process.env.JWT_SECRET)

    res.cookie("token",token);

    res.status(201).json({
        message:"user registered successfully!",
        user:{
            email:user.email,
            _id:user._id,
            fullName:user.fullName
        }
    })
}


async function loginUser(req,res){
    const { email, password} = req.body;

    const user = await userModel.findOne({
        email,
    })

    if(!user){
        return res.status(400).json({message:"Invalid Email , please try  again with valid email",})
    }

    const isPasswordValid = await bcrypt.compare(password,user.password);

    if(!isPasswordValid){
        return res.status(400).json({message:"Inavalid Password ,Try again"});
    }

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("token",token);

    res.status(200).json({message:"User LoggedIn successfully!"})
}


module.exports={
    registerUser,
    loginUser,
}