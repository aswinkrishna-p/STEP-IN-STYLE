const express = require('express');
const router = express();
const adminController = require('../controllers/admincontroller');
const path = require('path')
const {loggedin,loggedout} = require('../middleware/adminAuth')
const multer =require('multer')

const Storage = multer.diskStorage({
    destination:'public/images',
    filename:function(req,file,cb){
        const uniqueSuffix = `${Date.now()}-${file.originalname}`
        cb(null,uniqueSuffix)
    }
})

const upload = multer({storage:Storage})


// admin login
router.get('/',adminController.getLogin)

router.get('/login',loggedout,adminController.getLogin)    

router.post('/login',adminController.postlogin)

// dashboard

router.get('/dashboard',loggedin,adminController.getdashboard)



// user management

router.get('/userlist',adminController.getusermanager)

router.post('/search',adminController.searchUsers)

router.patch('/userlist/userstatus',adminController.getBlockandUnblock)

// productmanagement

router.get('/productlist',adminController.getProductlist)

router.post('/productlist',upload.array('photo',5),adminController.getaddproductPost)

router.get('/addproduct',adminController.getaddproduct)

router.post('/searchproduct',adminController.SearchProduct)

router.patch('/productlist/productstatus',adminController.productListUnlist)

router.get('/editproduct',adminController.geteditproduct)

router.post('/productlist/:id',upload.array('photo',5),adminController.editproductpost)


//category 

router.get('/categorylist',adminController.getCategorylist)

// router.get('/addcategory',adminController.getaddcategory)

router.post('/addcategory',adminController.addcategoryPost)

router.patch('/categorylist/categorystatus',adminController.categoryListUnlist)

// banner

router.get('/bannerlist',adminController.getbannerlist)

router.post('/addbanner',upload.single('photo'),adminController.addbanner)

router.post('/editbanner/:id',upload.single('photo'),adminController.editbanner)

router.patch('/bannerlist/deletebanner/',adminController.bannerListUnlist)
//logout

router.get('/logout',adminController.logout)
module.exports=router