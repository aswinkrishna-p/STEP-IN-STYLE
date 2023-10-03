
const mongoose = require('mongoose')


const subcategorySchema = mongoose.Schema({
    categoryName :{
        type:String,
        required:true
    },
    parentcategory:{
        type:{type:mongoose.Schema.Types.ObjectId,ref:'category'}
    },
    listed:{
        type:Boolean,
        default:false
    }
})

module.exports=mongoose.model('subcategory',subcategorySchema)