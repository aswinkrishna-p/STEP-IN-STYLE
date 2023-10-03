const mongoose = require('mongoose')

const productSchema =mongoose.Schema({

    productName:{
        type :String,
        required:true
    },
    category:{
        type: String,
        required :false
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required : true,
    },
    gender:{
        type:String
    },
    photo:{
        type:[String],
        
    },
    listed:{
        type:Boolean,
        default:true 
    },
    stock:{
        type:Number
    }

})

module.exports = mongoose.model('product',productSchema)