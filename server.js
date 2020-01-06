const express = require('express');
const app = express();
const port = 3000;
require('./db/db')
const User = require('./models/user')

//multer content used in implementation
const fs = require('fs'); // << node js module which allows access to local files for reading/writing files
const multer = require('multer'); // the node js module that writes a file/files object to the express request.
let filepath = './uploads/user'; // a path I defined to be used in creating relative paths (for static files), this can be anything "./temp" or created programatically 

const storage = multer.diskStorage({
        //determines the location where files will be saved - if nothing is provided the OS default direct for temp files is used.
        destination: function(req, file, cb){
            //console.log(req.route.path, 'a way of accessing what was ')
            //conditional file path depending on path could be useful for parsing file uploads
            //filepath is the file location (type: string) - currently in global scope. 
            const localpath = filepath.split('/').map((dir,i)=>{if(i>0){return "/"+dir;}}).join('');
            cb(null, './public'+localpath);
            //what is cb? - a callback function which accepts error object upon error and a string for where to store the file
        },

        //filename property determines the value of the file name to be recorded to our server. 
        //By default if no name is given, a random hash string will be provided 
        filename: function(req,file,cb){
            //file.original name is the original file name inside the file object passed by multer
            //needs to check if there is already a file in the destination folder 'uploads' and if so 
            // console.log(file, '<<<<filename')
            cb(null,file.originalname);
        }
    })
const upload = multer({storage: storage});

//if using default storage option: const upload = multer({dest:'uploads/'});
// since we have defined our location in storage we have more control over where the file is stored on our server. 

//MIDDLEWARE
app.use(express.static('public'))

// A helper function for asynchronously accessing all files in a particular directory
function getFilesFromDir (){  
    //Link for looping through a file structure using FS/PATH - https://stackoverflow.com/questions/32511789/looping-through-files-in-a-folder-node-js
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

//APP-ROUTES
app.get('/', async (req, res) => { 
    try{
        const allUsers = await User.find()
        //DEAD CODE - Earlier test for iterating through files. 
        //call function that gets all of the files via a promise & then render the index page. 
        // const test = getFilesFromDir().then((val)=>{    
        //   res.render('index.ejs', {
        //         dust: val
        //     })  
        // }) 
        res.render('index.ejs', {
                    users: allUsers
        })
    } catch(err){
        res.send(err);
    }
});

//upload.single -- the call back middleware function that precedes the request 
app.post('/single', upload.single('profile'), async (req,res)=>{
    try{
        console.log(req.file, 'at post route')
        const relpath = `${filepath}/${req.file.filename}`
        req.body.imgPath = relpath;
        console.log(req.body, 'after updates');
        const createdUser = await User.create(req.body);
        res.redirect(`/${createdUser._id}`);
    }
    catch(err){
        res.send(400);
    }
})

app.post('/stream', upload.single('profile'), async (req,res)=>{
    //'stream' - the path for the request triggering the single
    //'profile' - the body's key for the upload which must match the name of the input
    try{
        // let filepath = './uploads/user';
        const relpath = `${filepath}/${req.file.filename}`
        const localpath = './public'+relpath.substring(1);
        
        //converts the uploaded file 
        const fileContents = fs.readFileSync(localpath).toString('base64');
        
        //modifying req.body 
        req.body.imgData = `data:${req.file.mimetype};base64, `+fileContents;
        req.body.imgPath = relpath;
        req.body.imgType = req.file.mimetype;
        const createdUser = await User.create(req.body);

        //if you already had access to data from an object in your database  
        const newTarget = './public'+filepath.substring(1);
        //a int of the current time as milliseconds
        const date = Date.now();
        //a dynamically generated path 
        const newFileLocation = `${newTarget}/${date}_${req.file.filename}`
        //the process is handled by fs - writeFileSync which creates a local machine at a designated location - newFileLocation, with your data - fileContents, and the encoding type - 'base64'
        const newfile = fs.writeFileSync(newFileLocation,fileContents,'base64')
        res.redirect(`/${createdUser._id}`);
        // res.send(newTarget)
    }
    catch(err){
        res.sendStatus(400);
    }
})

app.get('/:id', async (req,res)=>{
    try{
        const foundUser = await User.findById(req.params.id);
        res.render('user_show.ejs', {
            user: foundUser,
        })
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