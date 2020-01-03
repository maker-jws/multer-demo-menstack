const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: String,
    //this should store a location of the file path
    imgPath: String,
    imgData: String,
    imgType: String,
})

const User = mongoose.model('User', userSchema);
module.exports = User;