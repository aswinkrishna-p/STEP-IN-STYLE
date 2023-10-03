

const mongoose = require ('mongoose')


const categorySchema = mongoose.Schema({

    gender:{
        type : String,
        required:true
    },
    listed:{
        type: Boolean,
        default:false
    },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'subcategory' }]

})

module.exports = mongoose.model('category',categorySchema)