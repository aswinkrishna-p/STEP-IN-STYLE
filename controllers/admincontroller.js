const User =require('../models/userModel')
const admin =require('../models/adminModel')
const product = require('../models/productModel')
const category = require('../models/categoryModel')
const subcategory = require('../models/subCategoryModel')
const banner = require('../models/bannerModel')
const orders = require('../models/orderModel')
const Coupon = require('../models/couponModel');
const { Parser } = require('json2csv');









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
    if(req.session.admin){
        const totalOrders = await orders.countDocuments({})
        const totalProducts = await product.countDocuments({listed:'true'})
        const deliveredOrders = await orders.find({orderStatus:'Delivered'})


        
        const pipeline = [
          {
            $match: { orderStatus: 'Delivered' }
          },
          {
            $group: {
              _id: '$paymentMode',
              count: { $sum: 1 }
            }
          }
        ];
        
        const paymentMethodCounts = await orders.aggregate(pipeline).exec();
        
        // console.log(paymentMethodCounts);

//  console.log(deliveredOrders);
        const blockedUsers = await User.countDocuments({is_blocked:'true'})
        const unblockedUsers = await User.countDocuments({is_blocked:'false'})
        let totalSales =0
        for(const orders of deliveredOrders){
            totalSales += orders.total
        }
        // console.log(totalSales)

        const monthSales = await orders.aggregate([
            {
              $match: {
                orderStatus: "Delivered"
              }
            },
            {
              $unwind: "$products"
            },
            {
              $project: {
                year: { $year: "$orderDate" },
                month: { $month: "$orderDate" },
                monthlySales: {
                  $multiply: ["$products.price", "$products.quantity"]
                }
              }
            },
            {
              $group: {
                _id: {
                  year: "$year",
                  month: "$month"
                },
                monthlySales: { $sum: "$monthlySales" }
              }
            },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                monthlySales: 1
              }
            },
            {
              $sort: {
                year: 1,
                month: 1
              }
            }
          ]);
          
        //   console.log(monthSales);
        //   const totalSalesFromMonthly = monthSales.reduce((total, month) => total + month.monthlySales, 0);
// console.log(totalSalesFromMonthly);
         
        res.render('admin/dashboard',{totalOrders,totalProducts,totalSales,monthSales ,unblockedUsers,blockedUsers,paymentMethodCounts})
    }
}

// sales 

const Adminsales = async(req ,res) =>{
        const from = req.query.from
        const to = req.query.to
        let selectedStatus = ''
        let salesReport

        try {
            salesReport = await orders.aggregate([
                { $match: { orderStatus: "Delivered" } },
                {
                  $unwind: "$products",
                },
                {
                  $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "productDetails",
                  },
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        order_id: "$_id",
                        customer_id: "$customer",
                        product_id: "$products.product",  // Assuming this is the reference to the product
                        product_name: "$products.name", // Should correctly populate product name
                        product_price: "$productDetails.price",
                        product_quantity: "$products.quantity",
                        order_date: "$orderDate",
                        payment_method: "$paymentMode",
                        total_amount: "$total",
                        address: {
                          name: "$address.name",
                          house: "$address.house",
                          post: "$address.post",
                          city: "$address.city",
                          state: "$address.state",
                          district: "$address.district",
                          contact: "$address.contact",
                        },
                      },
                },
                { $sort: { order_id: -1 } },
              ]);

             

              if (from && to) {
                const fromDate = new Date(from);
                const toDate = new Date(to);
              
                salesReport = salesReport.filter((prd) => {
                  const orderDate = new Date(prd.order_date);
                  return orderDate >= fromDate && orderDate <= new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
                });
               
              }

              res.render('admin/SalesReport',{salesReport,  selectedStatus})
              
        } catch (error) {
            console.log(error);
        }
}

const salesReportDownload = async (req , res) =>{
    try {
      const data = req.body
      console.log(req.body);
      let file = [];
      for (let i = 0; i < data.date.length; i++) {
          const row = {
              date: data.date[i],
              order_id: data.order_id[i],
              product: data.product[i],
              qty: data.qty[i], // Use 'qty' instead of 'product_quantity'
              payment: data.payment[i], // Use 'payment' instead of 'payment_method'
              amount: data.amount[i], // Use 'amount' instead of 'total_amount'
          };
          file.push(row);
      
          console.log(row,'rowwwwwwwwwwwww');
        }
        console.log(file);
      const json2csv = new Parser()
      const csv = json2csv.parse(file)
  
      res.attachment(`report-${Date.now()}.csv`)
      res.status(200).send(csv) 

    } catch (error) {
        console.log(error);
    }
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

const getProductlist = async (req, res) => {
    try {
      const perPage = 7; // Number of products to display per page
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter or default to 1
  
      const skip = (page - 1) * perPage;
      
      const products = await product.find()
        .skip(skip)
        .limit(perPage);

        const totalProducts = await product.countDocuments();
        const totalPages = Math.ceil(totalProducts / perPage);

      
      res.render('admin/productList', { products, currentPage: page ,totalPages});
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Error in fetching product data');
    }
  };
  

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
        const {productName,category,description,price,stock,gender,offer,expiryDate} =req.body
        
        const photo = req.files.map((file) => file.filename)
        // if(price<0){
        //   return  res.status(400).send("price can't be negavite")
        // }
        
        // if(!productName.trim()){
        //     return res.status(400).send("product name field cant't be empty")
        // }
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
            gender,
            offer:offer,
            expiryDate
        })
       
        await newProduct.save()
        res.redirect('/admin/productlist')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error adding the product.');
    }
}


// search product in productlist

const SearchProduct = async (req, res) => {
  try {
      const searchProd = req.body.Search;
      
      // Calculate the total number of pages based on the search results
      const perPage = 10; // Number of products per page (adjust as needed)
      const page = req.query.page || 1; // Get the page from the request query parameters

      const prod = await product
          .find({ productName: { $regex: searchProd, $options: 'i' } })
          .skip((page - 1) * perPage)
          .limit(perPage);

      // You also need to count the total number of products for pagination
      const totalCount = await product.countDocuments({ productName: { $regex: searchProd, $options: 'i' }})

      // Calculate the total number of pages
      const totalPages = Math.ceil(totalCount / perPage);

      res.render('admin/productlist', {
          products: prod,
          currentPage: page,
          totalPages: totalPages,
      });
  } catch (error) {
      console.log(error.message);
  }
};


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
     
        const {productName,category,description,price,stock,gender,offer,expiryDate,orginalPrice}= req.body

        const productid = req.params.id
        
        const updatedProduct = await product.findById(productid)
        
       if (req.files && req.files.length > 0) {
        updatedProduct.photo = req.files.map((file) => file.filename);
      } else {
    
        updatedProduct.photo = updatedProduct.photo;
      }
        
        // update the product fields 

        updatedProduct.productName = productName
        updatedProduct.category = category
        updatedProduct.description = description
        updatedProduct.price = price
        updatedProduct.stock = stock
        updatedProduct.gender = gender
        updatedProduct.offer = offer
        updatedProduct.expiryDate = expiryDate
        updatedProduct.orginalPrice = orginalPrice
        

      

        await updatedProduct.save()
        res.redirect('/admin/productlist')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('internal server error')
    }
}

const removeImage = async (req , res)=>{
  try {
     // Retrieve the image index from the request query
    //  const id = req.params.id;
     const imageId=req.body.url

     console.log("remove img");

     // Assuming you have access to the product
     // Remove the image at the specified index from the product's image array
     const productId = req.params.id; // Assuming you get the product ID from the route parameter
     const prd = await product.findById(productId);

     console.log(productId);
 
     if (!product) {
       return res.status(404).json({ success: false, message: 'Product not found' });
     }

     let indexToDelete = -1;
    for (let i = 0; i < prd.photo.length; i++) {
      if (prd.photo[i] === imageId) {
        indexToDelete = i;
        break;
      }
    }
    

    console.log(indexToDelete);

    if (indexToDelete === -1) {
      return res.status(404).json({ response: "Image not found in product" });
    }

    // Remove the image from the images array
    prd.photo.splice(indexToDelete, 1);

    // Save the updated product back to the database
    await prd.save();

       return res.json({ success: true, message: 'Image removed successfully' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
        const subcategories = await subcategory.find({listed:true})

    const categories = Array.from(new Set(subcategories.map(sub => sub.categoryName)))
        res.render('admin/bannerlist',{Banner,categories})
    } catch (error) {
        console.log(error.message);
    }
}

const addbanner = async (req ,res) =>{
try {   
    const { title,category } = req.body;
    const subcategories = await subcategory.find({listed:true})

    const categories = Array.from(new Set(subcategories.map(sub => sub.categoryName)))
    const photo = req.file?req.file.filename:'';

    // console.log('Title:', title);
    // console.log('Category:', category);
    // console.log('Photo:', photo);
    if(!title.trim()){
        return res.status(404).send('title cannot be empty')
    }

    existingBanner = await banner.findOne({ title: { $regex: new RegExp('^' + title + '$', 'i') },});
    if(existingBanner){
        return res.status(400).send('banner already exists');
    }
    const newBanner = new banner({
      title,
      photo,
      category
    });

    await newBanner.save();

    res.redirect('/admin/bannerlist')

    
} catch (error) {
    console.error(error);
    res.status(500).send(`Error adding banner: ${error.message}`);
  }
}

const editbanner = async (req,res) =>{
    const bannerid = req.params.id

    const {title,} = req.body
    console.log(req.body);
    const photo = req.file ? req.file.filename:'';
    try {

        const bannerExist = await banner.findById(bannerid)
        const subcategories = await subcategory.find({listed:true})

        const categories = Array.from(new Set(subcategories.map(sub => sub.categoryName)))
      
        if(!bannerExist){
            return res.status(404).send('banner not found')
        }
         // Check if another banner with the same title already exists
        //  const bannerWithSameTitle = await banner.findOne({ title: title });

        //  if (bannerWithSameTitle && bannerWithSameTitle._id.toString() !== bannerid) {
        //      return res.status(400).json({ message: 'Banner with the same title already exists.' });
        //  }

        if(!title.trim()){
            return res.status(400).send("banner title field cant't be empty")
        }

       
        bannerExist.title= title
        bannerExist.categories= categories

        if(photo){
            bannerExist.photo = photo
        }

        await bannerExist.save()
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

const deleteBannerController = async (req, res) => {
    try {
        const bannerId = req.params.bannerId;
        
        // Perform deletion logic here, e.g., using bannerId
        await banner.findByIdAndRemove(bannerId);
        
        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the banner' });
    }
};


// orders

const getOrders = async (req,res) =>{
    try {
      const order = await orders.find().populate('customer').sort({ orderDate: -1 }).exec();
        
        res.render('admin/orderlist',{order})
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const orderstatus = async (req ,res) =>{
    try {
        const orderId = req.params.id
          const newStatus = req.body.newValue;

        const orderdata = await orders.findById(orderId)

        const userdata = orderdata.customer

        const totalAmount = orderdata.total

        const currentDate = new Date();
    const date =  currentDate.toDateString();

        

        if(newStatus === "returned"){
            
            const updatedOrder = await orders.findByIdAndUpdate(
              orderId,
              { $set: { orderStatus: newStatus } },
              { new: true }
            );

             await User.findByIdAndUpdate(userdata, {
              $inc: { "wallet.balance": totalAmount },
              $push: { "wallet.transactions":{
                id:updatedOrder._id,
                date: date, // Replace this with the actual date value
                amount: totalAmount, // Replace this with the actual amount value
                status: 'true', // Replace this with the actual status value
              } 
             },
              }); 

             

        }else if (newStatus === "Cancelled" && orderdata.paymentMode === "online"){
            
            const updatedOrder = await orders.findByIdAndUpdate(
                orderId,
                { $set: { orderStatus: newStatus } },
                { new: true }
              );
              

               await User.findByIdAndUpdate(userdata, {
                $inc: { 'wallet.balance': totalAmount },
                $push: { 'wallet.transactions': updatedOrder._id.toString() }
              });
              

              const productsToUpdate = orderdata.products;

              // Update the stock for each product in the productsToUpdate array
              for (const productData of productsToUpdate) {
                const productId = productData.product;
                const quantity = productData.quantity;
          
                // Find the product in the products collection
                const Product = await product.findById(productId);
               
                if (Product) {
                  // Increment the stock by the canceled quantity
                  Product.stock += quantity;
                  await Product.save();
                }
              }

        }else if (newStatus === "refund" && orderdata.paymentMode === 'online'){
            const updatedOrder = await orders.findByIdAndUpdate(
                orderId,
                { $set: { orderStatus: "returned" } },
                { new: true }
              );

        }else if (newStatus === "refund & returned"){
            const updatedOrder = await orders.findByIdAndUpdate(
                orderId,
                { $set: { orderStatus: "returned" } },
                { new: true }
              );

              const productsToUpdate = orderdata.products;

              // Update the stock for each product in the productsToUpdate array
              for (const productData of productsToUpdate) {
                const productId = productData.product;
                const quantity = productData.quantity;
          
                // Find the product in the products collection
                const Product = await product.findById(productId);
          
                if (Product) {
                  // Increment the stock by the canceled quantity
                  Product.stock += quantity;
                  await Product.save();
                }
              }
        }else{
            const updatedOrder = await orders.findByIdAndUpdate(
                orderId,
                { $set: { orderStatus: newStatus } },
                { new: true }
              );
        }

        const productsToUpdate = orderdata.products;

        // Update the stock for each product in the productsToUpdate array
        for (const productData of productsToUpdate) {
          const productId = productData.product;
          const quantity = productData.quantity;
    
          // Find the product in the products collection
          const Product = await product.findById(productId);
                   
          if (Product) {
            // Increment the stock by the canceled quantity
            Product.stock += quantity;
            await Product.save();
          }
        }
          

         res.redirect('/admin/orders')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while updating order status.");
    }
}

// coupons

const getCoupons = async(req, res) =>{
    try {
        const coupons = await Coupon.find();
        res.render('admin/couponsList',{coupons})
    } catch (error) {
        console.log(error);
    }
}


const createCoupon = async (req, res) => {
    try {
        const code = req.body.code.trim();
        const type = req.body.type.trim();
        const discount = req.body.discount;
        const min = req.body.min;
        const expiry = req.body.expiry.trim();

        


        const existingCoupon = await Coupon.findOne({ code });

        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon with this code already exists.' });
        }

        const newCoupon = new Coupon({
            code,
            type,
            expiry: new Date(expiry), // Parse the expiry date as a Date object
            discount: parseFloat(discount), // Parse the discount as a number
            min: parseFloat(min), // Parse the min purchase as a number
           
        });

        // Save the new coupon to the database
        await newCoupon.save();
        res.redirect('/admin/coupons')
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const couponlistunlist = async (req,res)=>{
    try {
        const couponid = req.body._id

        const findcoupon = await Coupon.findById(couponid)
        if(!findcoupon){
            res.status(404).json({message:'coupon not found'})
        }
        findcoupon.isDeleted = !findcoupon.isDeleted
        findcoupon.save()
        res.status(200).json({ message: 'coupon status toggled successfully' });
    } catch (error) {
        console.log(error);
    }
}

const editCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const { code, type, discount, min, expiry } = req.body;

        // Validate input data (e.g., check for existing coupon code)
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon && existingCoupon._id != couponId) {
            return res.status(400).json({ message: 'Coupon with this code already exists.' });
        }

        // Find the coupon by its ID
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Update the coupon properties
        coupon.code = code;
        coupon.type = type;
        coupon.discount = discount;
        coupon.min = min;
        coupon.expiry = expiry;

        // Save the updated coupon
        await coupon.save();

       res.redirect('/admin/coupons')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

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
    Adminsales,
    salesReportDownload,
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
    removeImage ,
    getCategorylist,
    addcategoryPost,
    categoryListUnlist,
    getbannerlist,
    addbanner,
    editbanner,
    bannerListUnlist,
    deleteBannerController,
    getOrders,
    orderstatus,
    getCoupons,
    createCoupon,
    couponlistunlist,
    editCoupon,
    logout
}
