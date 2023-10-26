




const userModel = require("../models/userModel")

const is_blocked = async (req, res, next) => {
    try {
        const email = req.session.user;
    
            const user = await userModel.findOne({ email: email });
            
            if (user) {
                if (!user.is_blocked) {
                    next();
                } else {
                 
                    req.session.destroy((err) => {
                        if (err) {
                            console.error("Session destroy error:", err);
                        }
                        res.redirect("/login");
                    });
                }
            } else {
                // Handle the case where the user is not found
                next();
            }
    
        
    } catch (error) {
        // Handle other potential errors
        console.error("is_blocked middleware error:", error);
        res.redirect("/login");
    }
};


const loggedin = (req ,res,next) =>{
    try {
        
        if(req.session.user){
            next()
        }else {
            return res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message);
    }
}  

const loggedout = (req ,res, next) =>{
    try {
        if(!req.session.user){
            next()
        }else{

            return res.redirect('/')
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = is_blocked;


module.exports={
    is_blocked,
    loggedin,
    loggedout
}