const usermodel = require("../models/userModel");

const Product = require("../models/productModel");

const Category = require('../models/categoryModel')

const userOTPverify = require("../models/userOTPverify");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");


let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "stepinstyle68@gmail.com",
    pass: "eqzwdauuveoxlhtu",
  },
});

// send otp verification email

const userOTP = async (user, email) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    // mail options
    const mailOption = {
      from: "stepinstyle68@gmail.com",
      to: email,
      subject: "verify Your Email",
      html: `<p> Hey ${otp} This is your Verification OTP: <br> Your OTP is <b>${otp}</b> </p> <br> 
            <i>Otp will Expire in 1 Minute</i>`,
    };

    // hash the otp
    const hashOTP = await bcrypt.hash(otp, 10);
    await userOTPverify.deleteMany({ user: email });
    const newOTPverification = new userOTPverify({
      user: email,
      otp: hashOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000 * 10, // Expires in 10 minutes
    });
    await newOTPverification.save();

    transporter.sendMail(mailOption, (err) => {
      if (err) {
        console.log("Error occured");
        console.log(err);
      } else {
        console.log("code is sent");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// otp

const getverification = (req, res) => {
  const email = req.session.email;

  res.render("users/OTPverify", { email, user: false });
};

const verifyEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.redirect(
        "/verification?error=Empty otp details are not allowed"
      );
    }

    const sotp = await userOTPverify.findOne({ user: email });
    console.log(sotp);

    if (!sotp) {
      return res.redirect(
        `/verification?error=Account has been verified already!`
      );
    }
    const hashedOTP = sotp.otp;
    // const expiresAt = sotp.expiresAt;

    // if (Date.now() > expiresAt) {

    //     return res.redirect('/verification?error=OTP has expired, try again!');
    // }

    const validotp = await bcrypt.compare(otp, hashedOTP);
    console.log(validotp);
    if (!validotp) {
      return res.redirect("/verification?error=OTP is not matching");
    }

    let userCreated;

    if (req.session.paths == "postSignup") {
      userCreated = await usermodel.create({
        first_name: req.session.first_name,
        last_name: req.session.last_name,
        phone: req.session.phone,
        password: req.session.password,
        email: req.session.email,
        joinedDate: Date.now(),
      });
    }
    req.session.otpStage = false;
    req.session.user = userCreated.email;
    return res.redirect("/login?CreatedAccount=User Account have been Created");
  } catch (error) {
    console.log(error.message);
  }
};

// resend otp

const resendotp = async (req, res) => {
  try {
    const email = req.body.email;
    if (email) {
      await userOTP(email, email);
      res.redirect("/verification");
    } else {
      res.redirect("/signin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("resend otp failed");
  }
};

// signup

const getSignup = async (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    const error = req.query.error;
    res.render("users/signup", { user: false, error });
  }
};

const postSignup = async (req, res) => {
  try {
    req.session.paths = "postSignup";

    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let phone = req.body.phone;
    let email = req.body.email;
    let password = req.body.password;

    req.session.first_name = first_name;
    req.session.last_name = last_name;
    req.session.phone = phone;
    req.session.email = email;
    const hashpassword = await bcrypt.hashSync(password, 5);
    req.session.password = hashpassword;

    const phoneExist = await usermodel.findOne({ phone: phone });
    const emailExist = await usermodel.findOne({ email: email });

    if (phoneExist || emailExist) {
      return res.redirect("/signup?error=In given details User Already Exist!");
    } else {
      if (password.length < 6) {
        return res.redirect("/signup?error=Password at least 6 digits");
      }
      console.log(email);
      await userOTP(first_name, email);
      req.session.otpStage = true;
      res.redirect("/verification");
    }
  } catch (error) {
    console.log(error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).send(error.message);
  }
};

//  load home
const getHome = async (req, res) => {
  try {
    const email = req.session.user;
    const products = await Product.find({listed:true})
    const user = await usermodel.findOne({ email: email });

    if (user) {
      res.render("users/home", { user ,products});
    } else {
      res.render("users/home", {products, user: user || false });
    }
  } catch (error) {}
};

//login

const getlogin = async (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    const error = req.query.error;
    res.render("users/login", { user: false, error });
  }
};

const postlogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Find the user by email
    const user = await usermodel.findOne({ email: email });

    // Check if the user exists and the password is valid
    if (user) {
      if (user.is_blocked) {
        return res.redirect("/login?error=Admin blocked you");
      }
      const checkpassword = await bcrypt.compare(password, user.password);

      if (checkpassword) {
        req.session.user = user.email;
        res.redirect("/");
      } else {
        res.redirect("/login?error=invalid password");
      }
    } else {
      return res.redirect("/login?error=Invalid email");
    }
  } catch (error) {
    console.error(error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).send(error.message);
  }
};

//  <<<<<<<<< ---------forgot password

const getforgetPassword = (req, res) => {
  const error = req.query.error;
  res.render("users/forgotpass",{error});
};

const postforgetPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.redirect('/forgotpass?error=Email field cannot be empty');
    }

    req.session.tempemail = email;
    const userdata = await usermodel.find({ email: email });
    if (userdata) {
      await userOTP(email, email);
      req.session.otpStage = true;
      return res.redirect("/verifypass");
    }
  } catch (error) {
    console.error(error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).send(error.message);
  }
};


// email verify
const getverifypass = (req, res) => {
  const email = req.session.tempemail;
  res.render("users/verifypass", { email: email });
};

const postverifypass = async (req, res) => {
  try {
    let { email, otp } = req.body;
    req.session.email = req.body.email;
    if (!email || !otp) {
      return res.redirect(
        "/verifypass?error=Empty otp details are not allowed"
      );
    }

    const sendotp = await userOTPverify.findOne({ user: email });
    console.log(sendotp);

    if (!sendotp) {
      return res.redirect(
        `/verifypass?error=Account has been verified already!`
      );
    }
    const hashedOTP = sendotp.otp;
    // const expiresAt = sotp.expiresAt;

    // if (Date.now() > expiresAt) {

    //     return res.redirect('/verification?error=OTP has expired, try again!');
    // }

    const validotp = await bcrypt.compare(otp, hashedOTP);
    console.log(validotp);
    if (!validotp) {
      return res.redirect("/verifypass?error=OTP is not matching");
    }

    res.render("users/resetpass");
  } catch (error) {
    console.log(error.message);
  }
};

// reset password

const getresetpassword = (req, res) => {
  res.render("users/resetpass");
};

const postresetpassword = async (req, res) => {
  try {
    const passdetails = req.body;
    const email = req.session.email;
    console.log(email);
    console.log(req.body);
    const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z]).{6,}$/;
    if (passdetails.new_password == passdetails.confirm_password) {
      if (passwordRegex.test(passdetails.new_password)) {
        const hashpassword = await bcrypt.hashSync(passdetails.new_password, 5);
        await usermodel.updateOne(
          { email: email },
          { $set: { password: hashpassword } }
        );
        res.redirect("/login");
        res.status(200).send("password updated");
      } else {
        return res.status(400).send("invalid password");
      }
    } else {
      return res.status(400).send("password missmatch");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// cart

const getCart = async (req,res) =>{
  
  if(req.session.user){

    const email = req.session.user;  
    const user = await usermodel.findOne({ email: email }).populate({
      path:'cart.product',
      model:'product'
    }).exec()
// console.log(user);

    res.render('users/cart',{ user: user || false })
  }else{
    
 res.redirect('/login')   
  }



  

}

const addtocart = async (req, res) => {
  try {
    const productid = req.params.id;
    const email = req.session.user;
    const size = req.body.size;
    const price = parseInt(req.body.price);
    const totalPrice = price;
 
    const user = await usermodel.findOne({ email: email });

    if (user && user.cart) {
      // Check if the product is already in the cart
      const existingProduct = user.cart.find(
        (item) =>
          item.product.toString() === productid && item.size === size
      );

      if (existingProduct) {
        // If the product exists, update its quantity and total price
        existingProduct.quantity += 1;
        existingProduct.total += price;
      } else {
        // If the product doesn't exist, add it to the cart
        user.cart.push({
          product: productid,
          quantity: 1,
          size: size,
          price: price,
          total: totalPrice,
        });
      }
    } else {
      // If there is no cart for the user, create a new cart
      user.cart = [
        {
          product: productid,
          quantity: 1,
          size: size,
          price: price,
          total: totalPrice,
        },
      ];
    }

    await user.save();
    res.status(200).json({ response: 'ok' });
  } catch (error) {
    console.log(error.message);
  }
};

const updateQuantity = async (req, res) => {
  try {
    const productid = req.params.id;
    const action = req.params.action;
    const email = req.session.user; 
    // console.log(productid);

    // Fetch the user and product
    const user = await usermodel.findOne({ email });
    const product = await Product.findById(productid);

    if (!user || !product) {
      return res.status(404).json({ success: false, error: 'User or product not found' });
    }

    // Find the item in the user's cart
    const cartItem = user.cart.find(item => item.product._id.toString() === productid);

    if (!cartItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    // Update the quantity based on the action
    if (action === 'increase' && cartItem.quantity < product.stock) {
      cartItem.quantity++;
    } else if (action === 'decrease' && cartItem.quantity > 1) {
      cartItem.quantity--;
    }

    // Calculate the new total
    cartItem.total = cartItem.quantity * product.price;

    // Save the user document
    await user.save();

    res.status(200).json({ success: true, quantity: cartItem.quantity, total: cartItem.total });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

const getRemoveCart = async (req, res) => {
  try {
      const productId = req.params.productId;
      const email = req.session.user; // Assuming you have user sessions

      // Fetch the user
      const user = await usermodel.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Find the index of the item to remove
      const itemIndex = user.cart.findIndex(item => item.product._id.toString() === productId);

      if (itemIndex === -1) {
          return res.status(404).json({ success: false, error: 'Cart item not found' });
      }

      // Remove the item from the user's cart
      user.cart.splice(itemIndex, 1);

      // Save the user document
      await user.save();

      res.status(200).json({ success: true, message: 'Product removed from cart' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
  }
}




// whishlist

const getwishlist = async (req, res) =>{

  
    try {
      const email = req.session.user;
  
      // Find the user by email and populate the wishlist with product details
      const user = await usermodel.findOne({ email }).populate('wishlist.product');
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Extract the wishlist from the user object
      const wishlist = user.wishlist.map((item) => item.product);
  
      // Render the wishlist page with the user and wishlist data
      res.render('users/wishlist', { user: user || false, wishlist });
    } catch (error) {
      console.error("Error getting user's wishlist:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

  

const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const email = req.session.user;

    // Find the user by email
    const user = await usermodel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the product already exists in the wishlist
    const productExists = user.wishlist.some((item) =>
      item.product.toString() === productId
    );

    if (productExists) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add the product to the wishlist
    user.wishlist.push({ product: productId });

    // Save the updated user object
    await user.save();

    return res.status(200).json({ message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const  removefromwishlist = async (req ,res) => {
  try {
    const productId = req.params.productId;
    const email = req.session.user;

    // Find the user by email and remove the product from the wishlist
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove the product from the wishlist
    user.wishlist = user.wishlist.filter((item) => item.product.toString() !== productId);
    await user.save();

    return res.status(200).json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}




// test router
const getTest = async (req, res) => {

 const email= req.session.user
 const user = await usermodel.findOne({email:email})
  res.render("users/test",{user});
};

// products

const getProducts = async (req, res) => {
  const email = req.session.user;
  try {
    // Get form input values

    const malecategory = await Category.find({ gender: 'male' }).populate('subcategories');
    const femalecategory = await Category.find({ gender: 'female' }).populate('subcategories');
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    const page = parseInt(req.query.page) || 1; // Get page number from query parameters
    const perPage = 6; // Number of products per page
    const searchQuery = req.query.query || '';
    

    // Calculate the skip value based on the page number
    const skip = (page - 1) * perPage;

    // Construct the query based on filters
    const query = {
      listed: true,
      price: { $gte: minPrice, $lte: maxPrice },
    };

   

    if (req.query.gender) {
      query.gender = req.query.gender;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (searchQuery) {
      query.$or = [
        { productName: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive regex search
        { description: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // console.log("Query:", query);

    // Retrieve products with pagination
    const products = await Product.find(query)
      .skip(skip)
      .limit(perPage);

    const user = await usermodel.findOne({ email: email });

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    // Render the products with filtering, pagination, and sorting options
    res.render('users/productlist', {
      products,
      user: user || false,
      malecategory,
      femalecategory,
      currentPage: page,
      totalPages: totalPages,
      query: req.query, // Pass the query object to the template
    });
  } catch (error) {
    console.log(error);
  }
};

// single product view
const getsingleproduct = async (req, res) => {
  try {
    const id = req.query.productid;
    const email = req.session.user;

    const user = await usermodel.findOne({ email: email });
    const product = await Product.findOne({ _id: id });

    res.render("users/singleProduct", { product, user: user || false });
  } catch (error) {
    console.log(error.message);
  }
};

// logout

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Session destruction failed");
    } else {
      res.redirect("/login");
    }
  });
};

module.exports = {
  getSignup,
  getlogin,
  postlogin,
  getverifypass,
  postverifypass,
  getforgetPassword,
  postforgetPassword,
  getresetpassword,
  postresetpassword,
  postSignup,
  getHome,
  getTest,
  getverification,
  verifyEmail,
  resendotp,
  getProducts,
  getsingleproduct,
  getCart,
  addtocart,
  updateQuantity,
  getRemoveCart,
  getwishlist,
  addToWishlist,
  removefromwishlist,
  logout,
};
