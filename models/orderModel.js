const mongoose = require('mongoose')


const orderschema = mongoose.Schema({
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    products:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        name:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
    }],
    orderStatus:{
        type:String,
        default:'Pending'
    },
    paymentMode:{
        type:String,
        required:true
    },
    total:{
        type:Number
    },
    orderDate:{
        type:Date,
        default:Date.now
    },
    prevAmount:{
        type:Number
    },
    discount:{
        type:String
    },
    address:[{
        name:String,
        house:String,
        post:Number,
        city:String,
        state:String,
        district:String,
        contact:Number      
    }]
})

module.exports = mongoose.model('Order',orderschema)