const express=require('express')
const router= express()
const usercontroller= require('../controllers/usercontroller')
const userAuth = require('../middleware/userAuth')




// signup

router.get("/signup",usercontroller.getSignup)

router.post("/signup",usercontroller.postSignup)

// otp

router.get("/verification",usercontroller.getverification)

router.post("/otp",usercontroller.verifyEmail)

router.post('/verification/resendotp',usercontroller.resendotp)

// login 

router.get("/login",usercontroller.getlogin)

router.post("/login",usercontroller.postlogin)

router.get("/test",usercontroller.getTest)

// forgot pasword

router.get('/forgotpass',usercontroller.getforgetPassword)

router.post('/forgotpass',usercontroller.postforgetPassword)

router.get('/verifypass',usercontroller.getverifypass)

router.post('/verifypass',usercontroller.postverifypass)

router.get('/resetpass',usercontroller.getresetpassword)

router.post('/resetpass',usercontroller.postresetpassword)


router.get("/",usercontroller.getHome)

// products 

router.get("/products",userAuth.is_blocked,usercontroller.getProducts)

router.get("/singleproduct",userAuth.is_blocked,usercontroller.getsingleproduct)

// cart

router.get('/cart',userAuth.is_blocked,usercontroller.getCart)

router.post('/addtocart/:id',userAuth.is_blocked,usercontroller.addtocart)

router.post('/updateqnty/:id/:action',usercontroller.updateQuantity);

router.delete('/removeCartItem/:productId',usercontroller.getRemoveCart)
// wishlist

router.get('/wishlist',usercontroller.getwishlist)

router.post('/add-to-wishlist/:id', usercontroller.addToWishlist);

router.post('/removefromwishlist/:productId',usercontroller.removefromwishlist)



//logout


router.get('/logout',usercontroller.logout)


module.exports = router