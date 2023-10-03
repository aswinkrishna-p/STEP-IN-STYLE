const User =require('../models/userModel')
const bcrypt = require('bcrypt')
const admin =require('../models/adminModel')
const product = require('../models/productModel')
const category = require('../models/categoryModel')
const subcategory = require('../models/subCategoryModel')
const banner = require('../models/bannerModel')
// const { use } = require('../routes/adminRoute')






const getLogin =(req,res) =>{

    try{
        
        res.render('admin/login')

    }catch (error) {
        console.log(error.message);
    }
}

const postlogin = async(req,res) =>{
    try {
        
        const email = req.body.email.trim();
        const password = req.body.password.trim();

        const itsadmin = await admin.findOne({email});
      

            if(itsadmin){
                if(password == itsadmin.password){   
                    req.session.admin = itsadmin.email
                    console.log(req.session.admin),"inside the pass";
                    res.redirect('/admin/dashboard')
                }else{
                    return res.redirect('/admin/login')
                }
            }else{
                return res.redirect('/admin/login')
            }       
    } catch (error) {
        console.log(error.message);
    }
}
// dashboard

const getdashboard = async (req,res) =>{
    res.render('admin/dashboard')
}

// usermanagement
const getusermanager = async(req,res) =>{
        
    try {
        const data = await User.find()
        res.render('admin/Userslist',{data})
    
    } catch (error) {
        console.log(error);
    } 
    
}
// search users
const searchUsers = async (req, res) => {
    try {
      const searchTerm = req.body.search; // Get the search query 
      const users = await User.find({
        $or: [
          { first_name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }, 
        ],
      });
  
     
      res.render('admin/Userslist', { data: users });
    } catch (error) {
      console.error(error);
      
    }
  };

  //block and unblock

  const getBlockandUnblock = async (req, res) => {
    const userId = req.body._id; 
    try {
        // Find user by id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.is_blocked = !user.is_blocked;
        await user.save();

        res.status(200).json({ message: 'User status toggled successfully', user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// productmanagement

const getProductlist =  async(req ,res ) =>{

    try {
        const products =await product.find()
        
        res.render('admin/productList',{products})
    
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error in fetching product data')
    }

}

const getaddproduct = async (req, res) => {
    try {
    const subcategories = await subcategory.find({listed:true})

    const categories = Array.from(new Set(subcategories.map(sub => sub.categoryName)))

    const genders = await category.distinct('gender')

        res.render('admin/addProduct', { categories ,genders});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error fetching categories.');
    }
}

const getaddproductPost = async(req, res) =>{
    try {
        const {productName,category,description,price,stock,gender} =req.body
        const photo = req.files.map((file) => file.filename)
        if(price<0){
          return  res.status(400).send("price can't be negavite")
        }
        if(!productName.trim()){
            return res.status(400).send("product name field cant't be empty")
        }
        existingProduct = await product.findOne({ productName: { $regex: new RegExp('^' + productName + '$', 'i') },});
          
          if (existingProduct) {
            return res.status(400).send('Product already exists');
          }
          

        const newProduct = new product({
            photo,
            productName,
            category,
            description,
            price,
            stock,
            gender
        })

        

        await newProduct.save()
        res.redirect('/admin/productlist')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error adding the product.');
    }
}


// search product in productlist

const SearchProduct = async (req, res) =>{
    try {
        const searchProd = req.body.Search

        const prod = await product.find({productName:{$regex:searchProd, $options :'i'}})

        res.render('admin/productlist',{products: prod})

    } catch (error) {
        console.log(error.message);
    }
}

// product list and unlist

const productListUnlist = async (req, res) => {
    const productId = req.body._id; 
    try {
        // Find product by id
        const produ = await product.findById(productId);
        if (!produ) {
            return res.status(404).json({ message: 'product not found' });
        }

       
        produ.listed = !produ.listed;
       
        await produ.save();

        
        res.status(200).json({ message: 'product status toggled successfully', product });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// edit product 

const geteditproduct = async (req, res) =>{
    const productid = req.query.productid
    try {
        const prod =await product.findById(productid)
        const subcategories = await subcategory.find({listed:true})

        const categories = Array.from(new Set(subcategories.map(sub => sub.categoryName)))

        const genders = await category.distinct('gender')
        if(!prod){
            return res.status(404).send('product not found')
        }

        res.render('admin/editProduct',{product :prod,categories, genders })

    } catch (error) {
        console.log(error.message);
        res.status(500).send('inernal server error')
    }
}

const editproductpost =async (req ,res) =>{
    try {
     
        const {productName,category,description,price,stock,gender}= req.body

        const productid = req.params.id
        
        const updatedProduct = await product.findById(productid)
        
       if (req.files && req.files.length > 0) {
        updatedProduct.photo = req.files.map((file) => file.filename);
      } else {
    
        updatedProduct.photo = updatedProduct.photo;
      }
        if (!updatedProduct) {
            return res.status(404).send('Product not found');
        }

        if(price<0){
            return res.status(400).send("price can't be negative")
        }
        if(!productName.trim()){
            return res.status(400).send("product name field cant't be empty")
        }
        // existingProduct = await product.findOne({ productName: { $regex: new RegExp('^' + productName + '$', 'i') },});
          
        // if (existingProduct) {
        //   return res.status(400).send('Product already exists');
        // }
       
        
        // update the product fields 

        updatedProduct.productName = productName
        updatedProduct.category = category
        updatedProduct.description = description
        updatedProduct.price = price
        updatedProduct.stock = stock
        updatedProduct.gender = gender
        

        // if(photo){

        //     updatedProduct.photo =photo
        // }

        await updatedProduct.save()
        res.redirect('/admin/productlist')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('internal server error')
    }
}

// category 

const getCategorylist =  async(req ,res ) =>{

    try {

        const malecategory = await category.findOne({ gender: "male" }).populate("subcategories")
        const femalecategory = await category .findOne({ gender: "female" }).populate("subcategories");

        res.render('admin/categoryList',{ malecategory,femalecategory })
    
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error in fetching category data')
    }

}

// const getaddcategory =(req , res) =>{
//     res.render('admin/categorylist')
// }

const addcategoryPost = async (req, res) => {
    try {
      // Get the categoryName and gender from req.body
      const { categoryName, gender } = req.body;
  
      // Trim and convert to lowercase
      const trimmedCategoryName = categoryName.trim().toLowerCase();
      const trimmedGender = gender.trim().toLowerCase();
      let cat = await category.findOne({ gender: trimmedGender });
  
      if (!cat) {
        cat = new category({
          gender: trimmedGender,
          subcategories: [],
        });
      }
  
      const existingcategory = await category.findOne({
        gender: { $regex: new RegExp('^' + trimmedGender + '$', 'i') },
      });
      const existingSubcategory = await subcategory.findOne({
        categoryName: { $regex: new RegExp('^' + trimmedCategoryName + '$', 'i') },
      });
  
      if (existingcategory && existingSubcategory ) {
        return res.status(400).send('Category already exists');
      }
  
      const newcategory = new subcategory({ categoryName: trimmedCategoryName });
  
      await newcategory.save();
      cat.subcategories.push(newcategory._id);
      await cat.save();
      res.redirect('/admin/categorylist');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Error adding the category.');
    }
  };
  

const categoryListUnlist = async (req, res) => {
    const subcategoryid = req.body._id; 
    try {
        // Find category by id
        const categ = await subcategory.findById(subcategoryid)
        if (!categ) {
            return res.status(404).json({ message: 'category not found' });
        }
        categ.listed = !categ.listed;
       
        await categ.save();
        
        res.status(200).json({ message: 'category status toggled successfully', category });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getbannerlist = async(req, res) =>{
    try {
        const Banner =await banner.find()
        const Category = await category.find({listed:true})
        res.render('admin/bannerlist',{Banner,Category})
    } catch (error) {
        console.log(error.message);
    }
}
const addbanner = async (req ,res) =>{
try {   
    const { title,Category } = req.body;
    const photo = req.file?req.file.filename:'';
    if(!title.tirm()){
        return res.status(404).send('title cannot be empty')
    }

    existingBanner = await banner.findOne({ title: { $regex: new RegExp('^' + title + '$', 'i') },});
    if(existingBanner){
        return res.status(400).send('banner already exists');
    }
    const newBanner = new banner({
      title,
      photo,
      Category
    });

    await newBanner.save();

    res.status(200).send('Banner added successfully');
  } catch (error) {
    res.status(500).send('Error adding banner');
  }
}

const editbanner = async (req,res) =>{
    const bannerid = req.params.id

    const {title,Category} = req.body
    const photo = req.file ? req.file.filename:'';
    try {

        const bannerExist = await banner.findById(bannerid)
        const Category = await category.find({listed:true})

        if(!bannerExist){
            return res.status(404).send('banner not found')
        }

        if(!title.trim()){
            return res.status(400).send("banner title field cant't be empty")
        }

        existingBanner = await banner.findOne({ title: { $regex: new RegExp('^' + title + '$', 'i') },});
        if(existingBanner){
            return res.status(400).send('banner already exists');
        }

        bannerExist.title= title
        bannerExist.Category= Category

        if(photo){
            bannerExist.photo = photo
        }

        await bannerExist.save()


        // const updatebanner ={
        //     title:req.body.title,
        //     Category:req.body.Category

        // }

        // if(req.file && req.file.length >0){
        //     updatebanner.photo = req.file.filename
        //  }else{
        //     updatebanner.photo = bannerExist.photo
        //  }

        //  await banner.findByIdAndUpdate(bannerid,updatebanner)


         res.redirect('/admin/bannerlist')

    } catch (error) {
        console.log(error);
    }
}

const bannerListUnlist = async (req,res) =>{

    try {
        const bannerid = req.body._id
        // console.log(bannerid);
        const Banner = await banner.findById(bannerid)
        if(!Banner){
            return res.status(404).json({ message: 'banner not found' });
        }

        Banner.listed =!Banner.listed

        await Banner.save()
        res.status(200).json({ message: 'banner status toggled successfully' });
    } catch (error) {
       console.log(error.message); 
    }

}

// logout 

const logout =(req ,res) =>{
    req.session.destroy((err) =>{
        if(err){
            console.error('error destroying session',err)
            res.status(500).send('session destroying faield')
        }else{
            res.redirect('/admin/login')
        }
    })
}




module.exports ={

    getLogin,
    postlogin,
    getdashboard,
    getusermanager ,
    getProductlist,
    getaddproduct,
    getaddproductPost,
    searchUsers,
    getBlockandUnblock,
    SearchProduct,
    productListUnlist,
    geteditproduct,
    editproductpost,
    getCategorylist,
    addcategoryPost,
    categoryListUnlist,
    getbannerlist,
    addbanner,
    editbanner,
    bannerListUnlist,
    logout
}
