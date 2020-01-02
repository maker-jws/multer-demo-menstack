const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const fs = require('fs');
// const path = require('path');
require('./db/db')
let filepath = './uploads/user';
const storage = multer.diskStorage(
    {
        //determines the location where files will be saved - if nothing is provided the OS default direct for temp files is used.
        destination: function(req, file, cb){
            //console.log(req.route.path, 'a way of accessing what was ')
            //conditional file path depending on path could be useful for parsing file uploads
            //filepath is the file location (type: string) - currently in global scope. 
            const localpath = filepath.split('/').map((dir,i)=>{if(i>0){return "/"+dir;}}).join('');
            cb(null, './public'+localpath);
            //what is cb? - a callback function which accepts error object upon error
            //the syntax (error, path)
        },

        //filename property determines the value of the file name to be recorded to our server. 
        //By default if no name is given, a random hash string will be provided 
        filename: function(req,file,cb){
            //file.original name is the original file name inside the file object passed by multer
            //needs to check if there is already a file in the destination folder 'uploads' and if so 
            // console.log(file, '<<<<filename')
            cb(null,file.originalname);
        }
    }
)
const upload = multer({storage: storage});
//if using default storage option
// const upload = multer({dest:'uploads/'});
// since we have defined our location 

//MIDDLEWARE
app.use(express.static('public'))

function getFilesFromDir (){  
    return new Promise((resolve, reject)=>{
        const localpath = filepath.split('/').map((dir,i)=>{if(i>0){return "/"+dir;}}).join('');
        //add iterator with goal of appending ./public/ to front of the file path but leaving filepath alone
        fs.readdir(`./public/${localpath}`, function (err, files){
            if(err){
                console.error("Could not list the directory.", err);
                reject(err)
            }else {
                const filePaths = files.map(function (file, index) {
                    const path = "./"+filepath+"/"+file
                    return path;
                });
                resolve(filePaths);
            }
        })  
    });  
};
//Link for looping through a file structure using FS/PATH - https://stackoverflow.com/questions/32511789/looping-through-files-in-a-folder-node-js

//APP-ROUTES
app.get('/', async (req, res) => {
    //call function that gets all of the files via a promise then render the index page. 
    try{
        const test = getFilesFromDir().then((val)=>{    
            res.render('index.ejs', {
                dust: val
            })
        })    
    } catch(err){
        res.send(err);
    }
});
//upload.single -- the call back middleware function that precedes the request 
app.post('/single', upload.single('profile'), (req,res)=>{
    //'single' - the path for the request triggering the single
    //'profile' - the body's key for the upload which must match the name of the input
    try{
        const filepath = './'+req.file.path;
        req.body.imgPath = filepath;
        res.redirect('/');
    }
    catch(err){
        res.send(400);
    }
})
app.post('/bulk', upload.array('profiles', 4),(req,res)=>{
    //upload arrays adds an files object in req 
    try{
        console.log(req.files.length, 'number of files uploaded')
        res.send(req.files) 
    }catch(err){
        console.log(err);
        res.send(400)
    }
})

//An additional type of uploads is provided by multer which allows you to create multiple files with different inputs.
// var userUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])

app.listen(port, () => {
    console.log('listening to the port: ' + port);
});