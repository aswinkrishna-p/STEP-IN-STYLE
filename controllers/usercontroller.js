const usermodel = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Razorpay = require("razorpay");
const userOTPverify = require("../models/userOTPverify");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const userModel = require("../models/userModel");

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

// post otp
const verifyEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    const currentDate = new Date();
    const date =  currentDate.toDateString();


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

    const referralCode = generateReferralCode();

    let userCreated;

    if (req.session.paths == "postSignup") {
      userCreated = await usermodel.create({
        first_name: req.session.first_name,
        last_name: req.session.last_name,
        phone: req.session.phone,
        password: req.session.password,
        email: req.session.email,
        joinedDate: Date.now(),
        referral: referralCode,
      });
    }

    if (req.session.referral) {
      const referrer = await usermodel.findOne({
        referral: req.session.referral,
      });
      console.log(referrer, "refererr in session");
      if (referrer) {
        console.log("inside referrerrrrrrrrrrrrrrrrr");
        const referralAmount = 100;
        const jjd = await usermodel.updateOne(
          { _id: referrer._id },
          { $inc: { "wallet.balance": referralAmount } }
        );

        console.log("inside jjddddddddd", jjd);

        // You may also want to add a record of this transaction in the referrer's wallet
        referrer.wallet.transactions.push({
          id:referrer._id,
            date: date, // Replace this with the actual date value
            amount: referralAmount, // Replace this with the actual amount value
            status: 'true', // Replace this with the actual status value
      });

        // Save the updated referrer document
        await referrer.save();
      }
    }
    req.session.otpStage = false;
    req.session.user = userCreated.email;
    return res.redirect("/login?CreatedAccount=User Account have been Created");
  } catch (error) {
    console.log(error.message);
  }
};

// referral code

function generateReferralCode() {
  // You can use libraries like shortid or generate your custom code.
  return "REF" + Math.random().toString(36).substr(2, 8);
}

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
    const referralCode = req.query.referral;
    console.log(referralCode, "referralcode is in query");
    req.session.referral = referralCode;
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
    const products = await Product.find({ listed: true });
    const user = await usermodel.findOne({ email: email });

    if (user) {
      res.render("users/home", { user, products });
    } else {
      res.render("users/home", { products, user: user || false });
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
        // changed
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
  res.render("users/forgotpass", { error });
};

const postforgetPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.redirect("/forgotpass?error=Email field cannot be empty");
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

const getCart = async (req, res) => {
  if (req.session.user) {
    const email = req.session.user;
    const user = await usermodel
      .findOne({ email: email })
      .populate({
        path: "cart.product",
        model: "product",
      })
      .exec();
    // console.log(user);

    res.render("users/cart", { user: user || false });
  } else {
    res.redirect("/login");
  }
};

const apply_coupon = async (req, res) => {
  try {
    const { couponCode, total, prevtotal } = req.body;

    const email = req.session.user;

    console.log(req.body);

    const user = await usermodel.findOne({ email: email });
    const coupon = await Coupon.findOne({ code: couponCode });

    if (coupon) {
      // Check if the coupon has expired
      const currentDate = new Date();
      if (currentDate > coupon.expiry) {
        res.json({ success: false, message: "Coupon has expired" });
        return;
      }

      const min = parseInt(coupon.min);

      if (min <= prevtotal) {
        if (user.usedCoupons.includes(coupon._id)) {
          res.json({
            success: false,
            message: "Coupon already used by this user",
          });
          return;
        }

        let discount = coupon.discount;
        let discountedPrice;

        if (coupon.type === "PERCENTAGE") {
          const discounted = prevtotal * (discount / 100);
          discountedPrice = Math.floor(prevtotal - discounted);
          discount = coupon.discount + "%";
        } else if (coupon.type === "FIXED AMOUNT") {
          discountedPrice = prevtotal - discount;
        }

        req.session.discount = discount;
        req.session.discountedPrice = discountedPrice;

        // Respond with the discounted price
        res.json({
          success: true,
          discountedPrice,
          message: "Coupon added",
          discount,
        });
      } else {
        res.json({ success: false, message: "Coupon limit exceeded" });
      }
    } else {
      // Coupon code is not found in the database
      res.json({ success: false, message: "Invalid coupon code" });
    }
  } catch (error) {
    console.log(error);
  }
};

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
        (item) => item.product.toString() === productid && item.size === size
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
    res.status(200).json({ response: "ok" });
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
      return res
        .status(404)
        .json({ success: false, error: "User or product not found" });
    }

    // Find the item in the user's cart
    const cartItem = user.cart.find(
      (item) => item.product._id.toString() === productid
    );

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, error: "Cart item not found" });
    }

    // Update the quantity based on the action
    if (action === "increase" && cartItem.quantity < product.stock) {
      cartItem.quantity++;
    } else if (action === "decrease" && cartItem.quantity > 1) {
      cartItem.quantity--;
    }

    // Calculate the new total
    cartItem.total = cartItem.quantity * product.price;

    // Save the user document
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        quantity: cartItem.quantity,
        total: cartItem.total,
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getRemoveCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const email = req.session.user; // Assuming you have user sessions

    // Fetch the user
    const user = await usermodel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Find the index of the item to remove
    const itemIndex = user.cart.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Cart item not found" });
    }

    // Remove the item from the user's cart
    user.cart.splice(itemIndex, 1);

    // Save the user document
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Product removed from cart" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// whishlist

const getwishlist = async (req, res) => {
  try {
    const email = req.session.user;

    // Find the user by email and populate the wishlist with product details
    const user = await usermodel
      .findOne({ email })
      .populate("wishlist.product");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the wishlist from the user object
    const wishlist = user.wishlist.map((item) => item.product);

   

    // Render the wishlist page with the user and wishlist data
    res.render("users/wishlist", { user: user || false, wishlist });
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
    const productExists = user.wishlist.some(
      (item) => item.product.toString() === productId
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

const removefromwishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const email = req.session.user;

    // Find the user by email and remove the product from the wishlist
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the product from the wishlist
    user.wishlist = user.wishlist.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();

    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




// products

const getProducts = async (req, res) => {
  const email = req.session.user;
  try {
    // Get form input values
    const malecategory = await Category.find({ gender: "male" }).populate("subcategories");
    const femalecategory = await Category.find({ gender: "female" }).populate("subcategories");
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    const page = parseInt(req.query.page) || 1; // Get page number from query parameters
    const perPage = 6; // Number of products per page
    const searchQuery = req.query.query || "";
    const sortOrder = req.query.priceSort || "asc"; // Default to ascending order
    console.log('req query',req.query.priceSort);
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
        { productName: { $regex: searchQuery, $options: "i" } }, // Case-insensitive regex search
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Add sorting based on the selected sort order
    const sortOptions = {};
    if (req.query.priceSort) {
      sortOptions["price"] = sortOrder === "desc" ? -1 : 1;
    }
    console.log('sort option',sortOptions);
    
    // Retrieve products with pagination and sorting
    const products = await Product.find(query).sort(sortOptions).skip(skip).limit(perPage);

    const user = await usermodel.findOne({ email: email });

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    const currentDate = new Date();
    
    // Render the products with filtering, pagination, and sorting options
    res.render("users/productlist", {
      products,
      user: user || false,
      malecategory,
      femalecategory,
      currentPage: page,
      totalPages: totalPages,
      currentDate,
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
    console.log(product);
    const currentDate = new Date();

    if (product.offer && product.expiryDate) {

        if (currentDate <= product.expiryDate) {

            if (product.orginalPrice === 0) {

                console.log('offer ',product.price);

                let orginlPrice = product.price
                let discountPrice = (orginlPrice * product.offer) / 100
                let finalDiscPrce = Math.ceil(orginlPrice - discountPrice)
                console.log(finalDiscPrce);
                await Product.updateOne({ _id: id }, { $set: { discountPrice: finalDiscPrce } })
                await Product.updateOne({_id:id},{$set:{price:finalDiscPrce}})
                await Product.updateOne({_id:id},{$set:{orginalPrice:orginlPrice}})
            }
        }
    }


    res.render("users/singleProduct", { product, user: user || false,currentDate });
  } catch (error) {
    console.log(error.message);
  }
};

// checkout page
function calCartTotal(cartItems) {
  let cartTotal = 0;
  cartItems.forEach((item) => {
    cartTotal += item.total;
  });
  return cartTotal;
}

const getcheckout = async (req, res) => {
  try {
    const email = req.session.user;

    const user = await usermodel
      .findOne({ email: email })
      .populate({
        path: "cart.product",
        model: "product",
      })
      .exec();
      // console.log(user,'cart dedeeeeeeeeee');

    const coupons = await Coupon.find({ isDeleted: false });


    if (!user) {
      return res.status(404).send("User not found");
    }

    // Calculate the cart total on the server side
    const cartTotal = calCartTotal(user.cart);

    req.session.cartTotal = cartTotal;

    if (user) {
      if (user.cart.length <= 0) {
        return res.redirect("/");
      }
      const defaultAddress = user.address.find((address) => address.isDefault);

      res.render("users/checkout", {
        user: user || false,
        defaultAddress,
        cartTotal,
        coupons,
      });
      // console.log(defaultAddress);
      req.session.defaultAddress = defaultAddress;
      // console.log('helooo',req.session.defaultAddress);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred.");
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// confirm payment

const postcheckout = async (req, res) => {
  try {
    console.log(req.body);

    const email = req.session.user;
    const user = await usermodel
      .findOne({ email: email })
      .populate({
        path: "cart.product",
        model: "product",
      })
      .exec();
     
          // Parse each element of the array as JSON
    let currentuser = req.body.cartvalue.map((str) => {
      try {
        return JSON.parse(str);
      } catch (error) {
        console.error('Error parsing cartvalue element:', error);
        return null; // Handle the error or invalid JSON
      }
    });
    


    
    
    console.log("here 1")
    
    console.log("the current user",currentuser[0][0])
    
    // Check if parsing errors occurred and handle them
    if (currentuser.some((item) => item === null)) {
      return res.status(400).json({ error: 'Invalid cartvalue element(s)' });
    }
      
      console.log("access",currentuser[0][0].quantity);
      
      if (currentuser[0].length != user.cart.length) {
        console.log("inside the if")
        return res.json({ change: true });
      }
      
      for (let i = 0; i < user.cart.length; i++) {
        console.log("inside the loop")
        if (currentuser[0][i].quantity != user.cart[i].quantity) {
          console.log("inside the lopp if")
          return res.json({ change: true });
        }
      }




    const userdata = user._id;
    const currentDate = new Date();
    const date =  currentDate.toDateString();
    const formData = {
      firstname: req.body.firstName,
      lastname: req.body.LastName,
      state: req.body.state,
      address: req.body.address,
      city: req.body.city,
      post: req.body.Postcode,
      district: req.body.district,
      contact: req.body.phones,
    };
    //  console.log(formData);

  
    const paymentmethod = req.body?.payment || "";
    const carttotal = req.body.Total;
    const previous = req.body.prev;
    const couponcode = await Coupon.findOne({ code: req.body.coupon });
    let Discount;
    if (couponcode) {
      Discount = couponcode.discount;
    }
    console.log(carttotal);

    if(paymentmethod == "wallet"){

      const products = user.cart.map((cartItem) => {
        return {
          product: cartItem.product._id, // Assuming product details are stored in 'product' field
          name: cartItem.product.productName, // Use 'productName' from your schema
          price: cartItem.product.price, // Use 'price' from your schema
          quantity: cartItem.quantity,
        };
      });


      const neworder = new Order({
        customer: user._id,
        products: products, // Add the products array here
        orderStatus: "Pending",
        paymentMode: paymentmethod,
        total: carttotal,
        prevAmount: previous,
        discount: Discount,
        address: [
          {
            name: formData.firstname,
            house: formData.address,
            post: formData.post,
            city: formData.city,
            state: formData.state,
            district: formData.district,
            contact: formData.contact,
          },
        ],
      });
      console.log("new order ssssssssss", neworder);
      await neworder.save();

      for (const productData of products) {
        const productId = productData.product;
        const orderedQuantity = productData.quantity;

        // Find the product by ID in the database
        const product = await Product.findById(productId);

        if (product) {
          // Check if there is enough stock to fulfill the order
          if (product.stock >= orderedQuantity) {
            // Subtract the ordered quantity from the product's stock
            product.stock -= orderedQuantity;

            // Save the updated product back to the database
            await product.save();
          }
        }
      }

      await usermodel.findByIdAndUpdate(
        userdata,
        {
          $pull: {
            cart: {
              product: { $in: products.map((product) => product.product) },
            },
          },
        },
        { new: true }
      );

      let walletbalance=user.wallet.balance

      console.log(walletbalance);

      if (carttotal <= walletbalance) {
        walletbalance = walletbalance - parseInt(carttotal);
        console.log('After deduction: walletbalance', walletbalance);

        const newTransaction ={
          date:date,
          amount: -parseInt(carttotal), 
          status:'false',
        }
        user.wallet.transactions.push(newTransaction)
      }


      user.wallet.balance = walletbalance;
       await user.save();

     

      res.json({ codSuccess: true, message: "Order placed successfully!" });

      

    }else if (paymentmethod == "cod") {
      console.log("inside the cod");
      const products = user.cart.map((cartItem) => {
        return {
          product: cartItem.product._id, // Assuming product details are stored in 'product' field
          name: cartItem.product.productName, // Use 'productName' from your schema
          price: cartItem.product.price, // Use 'price' from your schema
          quantity: cartItem.quantity,
        };
      });

      const neworder = new Order({
        customer: user._id,
        products: products, // Add the products array here
        orderStatus: "Pending",
        paymentMode: paymentmethod,
        total: carttotal,
        prevAmount: previous,
        discount: Discount,
        address: [
          {
            name: formData.firstname,
            house: formData.address,
            post: formData.post,
            city: formData.city,
            state: formData.state,
            district: formData.district,
            contact: formData.contact,
          },
        ],
      });
      console.log("new order ssssssssss", neworder);
      await neworder.save();

      for (const productData of products) {
        const productId = productData.product;
        const orderedQuantity = productData.quantity;

        // Find the product by ID in the database
        const product = await Product.findById(productId);

        if (product) {
          // Check if there is enough stock to fulfill the order
          if (product.stock >= orderedQuantity) {
            // Subtract the ordered quantity from the product's stock
            product.stock -= orderedQuantity;

            // Save the updated product back to the database
            await product.save();
          }
        }
      }

      await usermodel.findByIdAndUpdate(
        userdata,
        {
          $pull: {
            cart: {
              product: { $in: products.map((product) => product.product) },
            },
          },
        },
        { new: true }
      );

      if(couponcode){
        user.usedCoupons.push(couponcode._id);
      await user.save();
      }

      res.json({ codSuccess: true, message: "Order placed successfully!" });
    } else if (paymentmethod == "online") {
      let amount = carttotal;

      const randomOrderID = Math.floor(Math.random() * 1000000).toString();
      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: randomOrderID,
      };

      razorpay.orders.create(options, (err) => {
        if (!err) {
          console.log("inside the razorpay");
          res.status(200).send({
            razorSuccess: true,
            msg: "order created",
            amount: amount * 100,
            key_id: "rzp_test_RAVzPoaQOw8pKU",
            name: formData.firstname,
            contact: formData.contact,
            email: user.email,
          });
        } else {
          console.error("Razorpay Error:", err);
          res
            .status(400)
            .send({
              razorSuccess: false,
              msg: "Error creating order with Razorpay",
            });
        }
      });
    }
  } catch (error) {
    console.error("Error in postcheckout:", error);
    res
      .status(500)
      .json({ success: false, message: "Order failed. Please try again." });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await usermodel
      .findOne({ email: email })
      .populate({
        path: "cart.product",
        model: "product",
      })
      .exec();
    const userdata = user._id;
    const couponcode = await Coupon.findOne({ code: req.body.coupon });
    let Discount;
    if (couponcode) {
      Discount = couponcode.discount;
    }

    const formData = {
      firstname: req.body.firstName,
      lastname: req.body.LastName,
      state: req.body.state,
      address: req.body.address,
      city: req.body.city,
      post: req.body.Postcode,
      district: req.body.district,
      contact: req.body.phones,
    };

    const paymentmethod = req.body?.payment || "";
    const carttotal = req.body.Total;
    const previous = req.body.prev;

    const products = user.cart.map((cartItem) => {
      return {
        product: cartItem.product._id,
        name: cartItem.product.productName,
        price: cartItem.product.price,
        quantity: cartItem.quantity,
      };
    });

    const neworder = new Order({
      customer: user._id,
      products: products, // Add the products array here
      ordreStatus: "Pending",
      paymentMode: paymentmethod,
      total: carttotal,
      prevAmount: previous,
      discount: Discount,
      address: [
        {
          name: formData.firstname,
          house: formData.address,
          post: formData.post,
          city: formData.city,
          state: formData.state,
          district: formData.district,
          contact: formData.contact,
        },
      ],
    });
    console.log("new order", neworder);
    await neworder.save();

    for (const productData of products) {
      const productId = productData.product;
      const orderedQuantity = productData.quantity;

      // Find the product by ID in the database
      const product = await Product.findById(productId);

      if (product) {
        // Check if there is enough stock to fulfill the order
        if (product.stock >= orderedQuantity) {
          // Subtract the ordered quantity from the product's stock
          product.stock -= orderedQuantity;

          // Save the updated product back to the database
          await product.save();
        }
      }
    }

    await usermodel.findByIdAndUpdate(
      userdata,
      {
        $pull: {
          cart: {
            product: { $in: products.map((product) => product.product) },
          },
        },
      },
      { new: true }
    );

    res.json({ success: true, message: "Order placed successfully!" });
  } catch (error) {
    console.log(error);
  }
};

// user profile

const getprofile = async (req, res) => {
  try {
    const email = req.session.user;

    const user = await usermodel.findOne({ email: email });
    let referralLink = "";

    if (user.referral) {
      const referralCode = user.referral;
      const signUpURL = "https://stepinstyle.site/signup";
      referralLink = `${signUpURL}?referral=${referralCode}`;
    }

    res.render("users/userProfile", { user: user || false, referralLink });
  } catch (error) {
    console.log(error);
  }
};

// edit profile

const updateProfile = async (req, res) => {
  try {
    const email = req.session.user;
    const user = await usermodel.findOne({ email: email });
    const userId = user._id;
    const { editFirstName, editLastName, editPhoneNumber } = req.body;

    console.log('bodyyyyy', req.body);
    console.log('userid', userId);

    // Update the user's profile in your database using promises
    const updatedUser = await usermodel.findByIdAndUpdate(
      userId,
      { first_name: editFirstName, last_name: editLastName, phone: editPhoneNumber }
    );

    if (!updatedUser) {
      // Handle the case where the user was not found or the update failed
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Profile updated successfully
    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    // Handle other errors, e.g., send an error response
    res.status(500).json({ error: 'Internal server error' });
  }
};


const add_Address = async (req, res) => {
  try {
    const email = req.session.user;

    const newAddress = {
      firstname: req.body.newFirstName,
      lastname: req.body.newLastName,
      house: req.body.newStreetAddress,
      post: req.body.newPostcodeZip,
      city: req.body.newTownCity,
      state: req.body.newState,
      district: req.body.newDistrict,
      contact: req.body.newPhone,
    };

    const user = await usermodel.findOne({ email: email });
    if (user) {
      if (!user.address) {
        user.address = [];
      }

      if (user.address.length === 0) {
        // If the user has no addresses, set the new address as default
        newAddress.isDefault = true;
      } else {
        // If the user has addresses, set the new address as not default
        newAddress.isDefault = false;
      }
      user.address.push(newAddress);
      await user.save();
      res.json({ success: true, message: "Address added successfully" });
    } else {
      // Handle if user is not found
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const getAddressBook = async (req, res) => {
  try {
    const email = req.session.user;

    const user = await usermodel.findOne({ email: email }).populate("address");

    res.render("users/addressBook", { user: user || false });
  } catch (error) {
    console.log(error);
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const email = req.session.user;

    // Find the user
    const user = await usermodel.findOne({ email: email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Clear the isDefault flag for all addresses
    user.address.forEach((address) => {
      address.isDefault = false;
    });

    // Find and mark the selected address as default
    const selectedAddress = user.address.id(addressId);
    if (!selectedAddress) {
      return res.status(404).send("Address not found");
    }
    selectedAddress.isDefault = true;

    // Save the changes
    await user.save();

    // Respond with a success message
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error setting default address");
  }
};

const editAddress = async (req, res) => {
  try {
   
    const addressId = req.body.addressId;


    // Extract the fields using the index
    const editFirstname = req.body.editFirstname;
    const editLastname = req.body.editLastname;
    const editHouse = req.body.editHouse;
    const editCity = req.body.editCity;
    const editState = req.body.editState;
    const editPost = req.body.editPost;
    const editDistrict = req.body.editDistrict;
    const editContact = req.body.editContact;

    const user = await usermodel.findOne({ 'address._id' : addressId });

   

    if (user) {
      // Find the specific address to update
      const addressToEdit = user.address.id(addressId);
      
     

      if (addressToEdit) {
        // Update the fields for the specific address
        addressToEdit.firstname = editFirstname;
        addressToEdit.lastname = editLastname;
        addressToEdit.house = editHouse;
        addressToEdit.city = editCity;
        addressToEdit.state = editState;
        addressToEdit.post = editPost;
        addressToEdit.district = editDistrict;
        addressToEdit.contact = editContact;

        await user.save();
      }
    }

    res.redirect("/address-book");
  } catch (error) {
    console.log(error); 
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const email = req.session.user;

    // Find the user
    const user = await usermodel.findOne({ email: email }).populate("address");

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Find the address to remove
    const addressToRemove = user.address.find(
      (address) => address._id.toString() === addressId
    );

    if (!addressToRemove) {
      return res.status(404).send("Address not found");
    }

    // Remove the address from the array
    user.address.pull(addressToRemove);

    // Save the changes
    await user.save();

    // Respond with a success message
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting address");
  }
};

const getorderspage = async (req, res) => {
  try {
    // Check if the user is logged in
    if (req.session.user) {
      const email = req.session.user;
      const user = await usermodel.findOne({ email: email });

      // Pagination parameters
      const perPage = 6; // Number of orders to display per page
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter or default to 1

      // Find orders associated with the logged-in user with pagination
      const orders = await Order.find({ customer: user._id })
        .populate("products.product")
        .sort({ orderDate: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

      // Count the total number of orders for pagination
      const totalCount = await Order.countDocuments({ customer: user._id });

      res.render("users/order", {
        user: user || false,
        orders: orders || [],
        currentPage: page,
        totalPages: Math.ceil(totalCount / perPage), // Calculate the total number of pages
      });
    } else {
      // Handle the case when the user is not logged in
      res.render("users/order", { user: false, orders: [] });
    }
  } catch (error) {
    console.log(error);
    // Handle any errors that occur during the retrieval of orders
    res.render("error", { message: "Error fetching orders." });
  }
};


const singleOrderDetails = async (req, res) => {
  try {
    const orderid = req.params.id;
    const email = req.session.user;

    const user = await usermodel.findOne({ email: email });
    const orders = await Order.findById(orderid).populate("products.product");

    //  console.log(orders);

    res.render("users/singleOrderDetails", {
      user: user || false,
      orders: orders || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

//cancel order

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const email = req.session.user;
    const user = await usermodel.findOne({ email: email });
    const userId = user._id;
    const refundmethod = req.body.refund;

    const currentDate = new Date();
    const date =  currentDate.toDateString();

    const cancelledOrder = await Order.findById(orderId);
    if (!cancelledOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    const totalAmount = cancelledOrder.total;

    console.log(cancelledOrder, "total");

    const payment = cancelledOrder.paymentMode;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Access the balance field directly

    console.log("cal", cancelledOrder.paymentMode);

    if (refundmethod) {
      if (cancelledOrder.paymentMode === "online" ) {
        if(refundmethod === "bank"){
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: "cancelled" },
            { new: true }
          );
        } else if (refundmethod === "wallet"){
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: "cancelled" },
            { new: true }
          );
  
          await usermodel.findByIdAndUpdate(userId, {
            $inc: { "wallet.balance": totalAmount },
            $push: { "wallet.transactions":{
              id:updatedOrder._id,
              date: date, // Replace this with the actual date value
              amount: totalAmount, // Replace this with the actual amount value
              status: 'true', // Replace this with the actual status value
            } 
           },

          });
        }
       
      } else if (cancelledOrder.paymentMode === "wallet" ) {
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { orderStatus: "cancelled" },
          { new: true }
        );

        console.log(totalAmount, "assasasasassssssssssssssssssssssssssssss");

       
        await usermodel.findByIdAndUpdate(userId, {
          $inc: { "wallet.balance": totalAmount },
          $push: { "wallet.transactions":{
            id:updatedOrder._id,
            date: date, // Replace this with the actual date value
            amount: totalAmount, // Replace this with the actual amount value
            status: 'true', // Replace this with the actual status value
          } 
         },
        });
      }
     }
    

    if (cancelledOrder.paymentMode === "cod") {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: "cancelled" },
        { new: true }
      );
    }
    const productsToUpdate = cancelledOrder.products;

    // Update the stock for each product in the productsToUpdate array
    for (const productData of productsToUpdate) {
      const productId = productData.product;
      const quantity = productData.quantity;

      // Find the product in the products collection
      const product = await Product.findById(productId);

      if (product) {
        // Increment the stock by the canceled quantity
        product.stock += quantity;
        await product.save();
      }
    }

    res.status(200).json({ success: true, response: "ok" });
  } catch (error) {
    console.log(error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).send(error.message);
  }
};

const return_Request = async (req, res) => {
  try {
    const orderId = req.params.id;
    const email = req.session.user;
    const user = await usermodel.findOne({ email: email });
    const userId = user._id;
    const refundmethod = req.body.refund;

    if (refundmethod === "wallet") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { orderStatus: "Return requested" } },
        { new: true }
      );
    } else if (refundmethod === "bank") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { orderStatus: "Return & Refund requested" } },
        { new: true }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const getInvoice = async (req, res) => {
  try {
    const email = req.session.user;
    const orderid = req.params.id;

    const user = await usermodel.findOne({ email: email });
    const orderdata = await Order.findById(orderid).populate(
      "products.product"
    );

    if (orderdata.length === 0) {
      return res.status(404).send("Order not found");
    }

    const orders = orderdata;

    res.render("users/Invoice", { user: user || false, orders });
  } catch (error) {
    console.log(error);
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
  postSignup,
  getlogin,
  postlogin,

  getverifypass,
  postverifypass,
  getforgetPassword,
  postforgetPassword,
  getresetpassword,
  postresetpassword,

  getHome,
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

  getcheckout,
  postcheckout,
  verifyPayment,
  apply_coupon,

  getprofile,
  updateProfile,
  add_Address,
  getAddressBook,
  setDefaultAddress,
  editAddress,
  deleteAddress,

  getorderspage,
  singleOrderDetails,
  cancelOrder,
  return_Request,
  getInvoice,

  logout,
};
