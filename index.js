// import dependencies
const express = require('express');
const req = require('express/lib/request');
const path = require('path');
const myApp = express();
const session = require('express-session');

// Setup DB Connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://0.0.0.0:27017/Travel_Blog', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
});

// Setup Database Model
const Order = mongoose.model('Travellers',{
    name : String, 
    email : String,
    phone : String,
    interest : String
});

const Admin = mongoose.model('Admin', {
    username: String,
    password: String
});

// Setup Session
myApp.use(session({
    secret: "thisismyrandomkeysuperrandomsecret",
    resave: false,
    saveUninitialized: true
}));

// Create Object Destructuring for Express Validator
const {check, validationResult} = require ('express-validator');

// Express Body-Parser
myApp.use(express.urlencoded({extended:true}));

//Set path to public and views folder.
myApp.set('views', path.join(__dirname, 'views'));
myApp.use (express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//------------------- Validation Functions --------------------

var phoneRegex = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/; // 123-123-1234 OR 1231231234
var positiveNumber = /^[1-9][0-9]*$/;

function checkRegex(userInput, regex)
{
    if (regex.test(userInput))
        return true;
    else   
        return false;
}

function customPhoneValidation(value)
{
    if (!checkRegex(value, phoneRegex))
    {
        throw new Error ('Please enter correct format: 123-123-1234!');
    }
    return true;
}

function customLunchAndTicketValidations (lunch, {req})
{
    var tickets = req.body.tickets;
    if (!checkRegex(tickets,positiveNumber))
    {
        throw Error ('Please select tickets and tickets must be a positive number!');
    }
    else
    {
        tickets = parseInt(tickets);
        if (tickets < 3 && lunch != 'yes')
        {
            throw Error ('Lunch is required, if you buy less than 3 tickets!');
        }
    }
    return true;
}

//------------------- Set up different routes (pages) --------------------

// Root Page
myApp.get('/', function(req, res){
    res.render('travel'); // No need to add .ejs extension to the command.
});

// Render the form
myApp.get('/traveller_details', function(req, res) {
    res.render('traveller_details');
});

// Handle form submission
myApp.post('/traveller_details', [
    check ('name', 'Name is required!').notEmpty(),
    check ('email', 'Please enter a valid email address!').isEmail(),
    check ('phone', '').custom(customPhoneValidation),
    // check ('lunch').custom(customLunchAndTicketValidations)
],function(req, res){

    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty())
    {
        res.render('traveller_details', {errors : errors.array()});
    }

    else 
    {
		// No errors
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var interest = req.body.interest;
        
        var pageData = {
            name : name, 
            email : email,
            phone : phone,
            interest : interest,
        };

        // Save the form data into Database
        var myOrder = new Order(pageData);
        myOrder.save().then(function() {
            console.log("Traveller details added!");
            res.redirect('/traveller_details');
        }).catch(function (x) {
            console.log(`Error: ${x}`);
            res.render('traveller_details', {errors: [{msg: 'An error occurred while saving the form data.'}]});
        });
    }
});


// All Orders Page
myApp.get('/allorders', function(req, res){
    // If session exists, then access All Orders Page.
    if (req.session.userLoggedIn)
    {
        // Read documents from MongoDb
        Order.find({}).exec(function (err, ordersValue){
            console.log(`Error: ${err}`);
            console.log(`Orders Value:: ${ordersValue}`);
            res.render('allorders', {ordersKey: ordersValue}); // No need to add .ejs extension to the command.
        })
    }
    // Otherwise redirect user to login page.
    else
        res.redirect('/login');
    
});

// Login Page
myApp.get('/login', function(req, res) {
    res.render('login');
});

// Login Page
myApp.post('/login', function(req,res) {
    var user = req.body.username;
    var pass = req.body.password;
    console.log(`Username is: ${user}`);
    console.log(`Password is: ${pass}`);

    Admin.findOne({username:user, password: pass}).exec(function(err, admin) {
        console.log(`Error is: ${err}`);
        console.log(`Admin is: ${admin}`);
        if (admin)
        {
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            res.redirect('/allorders');
        }
        else
        {
            res.render('login', {error: "Sorry login failed. Please try again!"});
        }
    });

});

// Logout Page
myApp.get('/logout', (req,res) => {
    // Remove Stored Session and redirect user to login page.
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', {error: 'Successfully logged out!'});
});

// Delete Page
// after /delete, whatever comes after : is consider as a variable (parameter).
// variable name can be anything.
myApp.get('/delete/:id', (req,res) => {
    // Check if session exists.
    if (req.session.userLoggedIn)
    {
        // Delete record from MongoDb.
        var id = req.params.id;
        //Order.collection.deleteOne(id);
        console.log(`Deleted Object Id: ${id}`);
        Order.findByIdAndDelete({_id : id}).exec(function(err, order) {
            console.log(`Error: ${err}`);
            console.log(`Order: ${order}`);
            if (order)
                res.render('delete', {message: "Deleted Successfully...!"});
            else
                res.render('delete', {message: "Sorry, Record Not Deleted...!"});
        });
    }
    // Otherwise redirect user to login page.
    else
        res.redirect('/login');
});

// Edit/Update Page
myApp.get('/edit/:id', (req,res) => {
    // Check if session exists.
    if (req.session.userLoggedIn)
    {
        // Read object from MongoDb to Edit.
        var id = req.params.id;
        console.log(`Object Id: ${id}`);
        Order.findById({_id : id}).exec(function(err, order) {
            console.log(`Error: ${err}`);
            console.log(`Order: ${order}`);
            if (order)
                res.render('edit', {order : order});
            else
                res.send ('No order found with this id....!');
        });
    }
    // Otherwise redirect user to login page.
    else
        res.redirect('/login');
});
/* 
// Edit Page - Post Method
myApp.post('/edit/:id', [
    check ('name', 'Name is required!').notEmpty(),
    check ('email', 'Please enter a valid email address!').isEmail(),
    check ('phone', '').custom(customPhoneValidation),
    check ('lunch').custom(customLunchAndTicketValidations)
],function(req, res){
    // check for errors
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty())
    {
        // Edit and display errors if any.
        var id = req.params.id;
        console.log(`Object Id: ${id}`);
        Order.findById({_id : id}).exec(function(err, order) {
            console.log(`Error: ${err}`);
            console.log(`Order: ${order}`);
            if (order)
                res.render('edit', {order : order, errors : errors.array()});
            else
                res.send ('No order found with this id....!');
        });
    }
    else 
    {
		// No errors
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var lunch = req.body.lunch;
        var tickets = req.body.tickets;
        var campus = req.body.campus;

        var subTotal = tickets * 20;
        if (lunch == 'yes')
        { subTotal += 15; }

        var tax = subTotal * 0.13;
        var total = subTotal + tax;

        var pageData = {
            name : name, 
            email : email,
            phone : phone,
            postcode : postcode,
            lunch : lunch,
            tickets : tickets,
            campus : campus,
            subTotal : subTotal,
            tax : tax,
            total : total
        }
    };

    // Update MongDb with Existing (Modified) Data. 
    var id  = req.params.id;
    Order.findByIdAndUpdate({_id : id}).exec(function(err, order) {
        order.name = name, 
        order.email = email,
        order.phone = phone,
        order.postcode = postcode,
        order.lunch = lunch,
        order.tickets = tickets,
        order.campus = campus,
        order.subTotal = subTotal,
        order.tax = tax,
        order.total = total
        order.save();
    });

    // Display the output: Updated Information
    res.render('editsuccess', pageData); // no need to add .ejs extension to the command.
}); */

// Author Page
myApp.get('/author', function(req, res){
    res.render('author', {
        studentName: "admin",
        studentNumber: "32456"
    }); // No need to add .ejs extension to the command.
});

myApp.listen(8080);
console.log('Everything executed fine... Open http://localhost:8080/');