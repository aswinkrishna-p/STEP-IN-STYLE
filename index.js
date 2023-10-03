const mongoose = require("mongoose");
const session =require('express-session')
const express = require ("express")
const dotenv =require('dotenv').config()
const app = express()
const path= require("path")
const nocache = require('nocache')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')


const POTR = process.env.POTR || 3000
mongoose.connect(process.env.Mongodb_link)
.then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error(error.message);
  });




app.set('view engine','ejs')

app.set('views','./views')

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(nocache())

app.use(express.static(path.join(__dirname,'public')))

app.use(session({
    secret: 'your-secret-key',       
    resave: false,                
    saveUninitialized: false,                          
}));   

app.use("/",userRoute)

app.use('/admin',adminRoute)



app.listen( POTR, () =>{
    console.log(`Server is running on port :http://localhost:${POTR }`);
})