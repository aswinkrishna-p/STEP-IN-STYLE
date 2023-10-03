const mongoose= require("mongoose")

const user =mongoose.Schema({

    first_name:{
        type: String,
        required:true
    },
    last_name:{
        type:String,
        required:true
    },  email: {
        type: String,
        required: true,
        unique:true
    },
    phone: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    admin_status: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    defaultAddress:{
        type: String
    },joinedDate:{
        type :Date,
        required:true
    },wishlist: [
        {
            product: {
                type: mongoose.Types.ObjectId,
                ref: 'product'
            }
        }],
    cart:[ {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
        },
        quantity:{
            type:Number
        },
        price:{
            type:Number
        },
        size:{
            type:Number
        },
        total:Number
    }]
})

   module.exports = mongoose.model("User",user);