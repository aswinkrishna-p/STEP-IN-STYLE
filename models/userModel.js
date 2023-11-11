const mongoose= require("mongoose")
const { Decimal128 } = mongoose.Types;
const { ObjectId } = require('mongoose');

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
    },
    joinedDate:{
        type :Date,
        required:true
    },
    wishlist: [
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
    }],
    address: [{

        firstname:{type:String},
        lastname:{type:String},
        house:{type:String},
        post: { type: Number },
        city: { type: String },
        state: { type: String },
        district: { type: String },
        contact:{type:Number},
        isDefault: {
            type: Boolean,
            default: false, // Set it to false by default
          },
  }],
  wallet: {

    balance: {
        type: Decimal128,
    default: 0.0
    },
    transactions: [{
        id: {
          type: ObjectId,
        },
        date: {
          type: Date,
        },
        amount: {
          type: Number,
        },
        status: {
          type: Boolean,
        }
      }]
},
 referral:{
    type:String
},

  usedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'coupon' }],
})

   module.exports = mongoose.model("User",user);