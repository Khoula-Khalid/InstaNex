const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const bcrypt = require('bcrypt');

const registerLoad = async(req, res)=>{

        try {
            
            res.render('register');

        } catch (error) {
            console.log(error.message);
        }

}

const register = async(req, res)=>{
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'images/'+req.file.filename,
            password: passwordHash
        });

        await user.save();

        res.render('register',{ message: 'User Register Successfuly! Please Go to login page.' });
            
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async(req, res)=>{
    try {

        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}

const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                req.session.user = userData;
                return res.redirect('/dashboard');
            } else {
                // Password doesn't match, 
                return res.render('login', { message: 'Email or Password is incorrect!', email: email, password: '' });
            }
        } else {
            // User not found, r
            return res.render('login', { message: 'Email or Password is incorrect!', email: email, password: '' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}



const logout = async(req, res)=>{
    try {

        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req, res)=>{
    try {

        var users = await User.find({ _id: { $nin:[req.session.user._id] } });

        res.render('dashboard',{ user: req.session.user, users:users });

    } catch (error) {
        console.log(error.message);
    }
}

const saveChat = async(req,res)=>{
    try {
       var chat = new Chat({
            sender_id:req.body.sender_id,
            receiver_id:req.body.receiver_id,
            message:req.body.message,
        });

       var newChat = await chat.save();
        res.status(200).send({ success:true, msg:'Chat inserted!', data:newChat });

    } catch (error) {
        console.error("Error occurred while saving chat:", error);
        res.status(400).send({ success:false,msg:error.message });
    }
}

const deleteChat = async(req,res)=>{
    try {

        await Chat.deleteOne({ _id:req.body.id });

        res.status(200).send({ success:true });
        
    } catch (error) {
        res.status(400).send({ success:false,msg:error.message });
    }
}

const forgotPasswordPage = (req, res) => {
    res.render('forgot'); 
}

const changePassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password in the database
        user.password = hashedPassword;
        await user.save();
        res.render('forgot', { message: 'Password Updated Successfully!' });

        return res.redirect('/forgot?message=Password%20updated%20successfully');
        
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};




module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
    deleteChat,
    forgotPasswordPage,
    changePassword
}