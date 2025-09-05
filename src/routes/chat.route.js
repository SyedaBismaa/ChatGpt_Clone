const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router();


router.post('/',authMiddleware.authUser)

module.exports=router;