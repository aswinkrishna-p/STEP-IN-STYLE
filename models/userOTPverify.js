const mongoose = require("mongoose")

const otpVerification=new mongoose.Schema({
    user:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date,
})
const userOTP = mongoose.model("otpVerification",otpVerification)

module.exports=userOTP