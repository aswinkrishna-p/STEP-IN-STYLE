const express=require('express')
const router= express()
const usercontroller= require('../controllers/usercontroller')
const {is_blocked,loggedin,loggedout} = require('../middleware/userAuth')





// signup

router.get("/signup",usercontroller.getSignup)

router.post("/signup",usercontroller.postSignup)

// otp

router.get("/verification",usercontroller.getverification)

router.post("/otp",usercontroller.verifyEmail)

router.post('/verification/resendotp',usercontroller.resendotp)

// login 

router.get("/login",loggedout,usercontroller.getlogin)

router.post("/login",usercontroller.postlogin)


// forgot pasword

router.get('/forgotpass',usercontroller.getforgetPassword)

router.post('/forgotpass',usercontroller.postforgetPassword)

router.get('/verifypass',usercontroller.getverifypass)

router.post('/verifypass',usercontroller.postverifypass)

router.get('/resetpass',usercontroller.getresetpassword)

router.post('/resetpass',usercontroller.postresetpassword)


router.get("/",usercontroller.getHome)

// products 

router.get("/products",is_blocked,usercontroller.getProducts)

router.get("/singleproduct",is_blocked,usercontroller.getsingleproduct)

// cart

router.get('/cart',is_blocked,loggedin,usercontroller.getCart)

router.post('/addtocart/:id',is_blocked,loggedin,usercontroller.addtocart)

router.post('/updateqnty/:id/:action',usercontroller.updateQuantity);

router.delete('/removeCartItem/:productId',usercontroller.getRemoveCart)

router.post('/apply-coupon',usercontroller.apply_coupon);


// wishlist

router.get('/wishlist',is_blocked,loggedin,usercontroller.getwishlist)

router.post('/add-to-wishlist/:id',usercontroller.addToWishlist);

router.post('/removefromwishlist/:productId',usercontroller.removefromwishlist)

// checkout

router.get('/checkout',is_blocked,loggedin,usercontroller.getcheckout)

router.post('/checkout',usercontroller.postcheckout)

router.post('/verify-payment',usercontroller.verifyPayment)

// user profile

router.get('/userprofile',is_blocked,loggedin,usercontroller.getprofile)

router.post('/updateProfile',is_blocked,loggedin,usercontroller.updateProfile)

// address

router.post('/add-address',loggedin,usercontroller.add_Address)

router.get('/address-book',is_blocked,loggedin,usercontroller.getAddressBook)

router.post('/editaddress',usercontroller.editAddress)

router.post('/set-default-address/:addressId', usercontroller.setDefaultAddress);

router.delete('/delete-address/:addressId', usercontroller.deleteAddress);

// orders

router.get('/orders',is_blocked,loggedin,usercontroller.getorderspage)

router.get('/orders/orderDetail/:id',is_blocked,loggedin,usercontroller.singleOrderDetails)

router.patch('/cancel-order/:id', usercontroller.cancelOrder)

router.patch("/return-request/:id",is_blocked,loggedin,usercontroller.return_Request)

router.get('/orders/invoice/:id',loggedin,usercontroller.getInvoice)

//logout


router.get('/logout',usercontroller.logout)


module.exports = router