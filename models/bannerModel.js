const mongoose = require('mongoose')


const bannerSchema = mongoose.Schema({

    title:{
        type:String
    },
    photo:{

     type:String
    },
    category:{
        type :String
    },

    listed:{
        type:Boolean,
        default:false
    }

})

module.exports=mongoose.model('banner',bannerSchema)