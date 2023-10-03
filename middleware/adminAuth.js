

const loggedin = (req ,res,next) =>{
    try {
        
        if(req.session.admin){
            next()
        }else {
            return res.redirect('/admin/login')
        }

    } catch (error) {
        console.log(error.message);
    }
}   

const loggedout = (req ,res, next) =>{
    try {
        if(!req.session.admin){
            next()
        }else{

            return res.redirect('/admin/dashboard')
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports ={
    loggedin,
    loggedout
}