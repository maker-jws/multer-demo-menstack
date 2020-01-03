# multer-demo-menstack : adding multer to your Express App

A short demo application for adding files to a remote server. Users can create user and upload a profile picture.

## Lesson Objectives

1. Review Code
1. Explain Multer Components
1. Demonstrate Routes
1. Basic Configurations

## Review Code

### Explain Multer Components

1. **Importing the module from express:** 
    ```javascript
    const fs = require('fs'); 
    const multer = require('multer'); 
    let filepath = './uploads/user'; 
    ```
    fs - a node module that handles local file systems

    multer - the express library for handling file management (typically images)

    filepath - defined as the relative location for all file displays on page - can be programatically redefined.

2. **Setting Up Storage:** 
    ```javascript

    const storage = multer.diskStorage({
        destination: function(req, file, cb){
            
            //programmatically redefining the path for saving your files 
            
            const localpath = filepath.split('/')
                .map((dir,i)=>{if(i>0){return "/"+dir;}})
                .join('');

            //this helper parser removes the first character from the string -- 
            //additional code injection could take place here based on the request conditions. 

            cb(null, './public'+localpath);

            //what is cb? - a callback function which accepts error object upon encountering an error 
            //and a string telling multer where to store the file
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

    ```

Storage is an object with a two options destination,filename - determines the location where files will be saved - if nothing is provided the OS default direct for temp files is used. If you do not defined 'storage' multer's default storage option: 
    
    ``` javascript
        const upload = multer({dest:'uploads/'});
    ```
    
Since we have defined our location in storage we have more control over where the file is stored on our server. 

3. **Defining Upload:** 
    ```javascript
        const upload = multer({storage: storage});
        
        //upload is our variable that 'does the magic' -it invokes the storage type (in our example diskStorage, and can also accept several options (such as file filters and other limiters)--not shown here);
    ```


## Demonstrating Routes

### Uploading a single file 
```javascript
    app.post('/single', upload.single('profile'), async (req,res)=>{
        
        //'single' - the path for the request triggering the single
        //'profile' - the body's key for the upload which must match the name of the input

        try{
            const relpath = `${filepath}/${req.file.filename}`
            req.body.imgPath = relpath;
            const createdUser = await User.create(req.body);
            res.redirect(`/${createdUser._id}`);
        }
        catch(err){
            res.send(400);
        }
    })
```
### our EJS template 
```html
    <!-- This form action matches the route in your controller, in my example - server.js -->

     <form action="/stream" method="post" enctype="multipart/form-data">
        <label for="name_input">Name</label>
        <input id="name_input" type="text" name="name" placeholder="enter your name"/>
        <label for="email_input">Email</label>
        <input id="email_input" type="email" name="email" placeholder="enter valid email"/>
        <label for="password_input">Password</label>
        <input id="password_input" type="password" name="password" 
            placeholder="enter password"/>

        <!-- This part is important - the name should match the string used in upload.single('profile') -->

        <input type="file" name="profile" />
        <input type="submit">
      </form>
```
This is the input form used for initializing the upload.single() method. It is similar to our previous experience with input forms, but we will use a type = 'file' to all our browser to accept files. multer will use this form-data and process it into an object -> req.file

### Uploading multiple files
```javascript
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
```
This method upload.array() allows the form to send multiple files; it takes two paramaters - the input's name ('profiles') - and a limiter that defines the size of the gallery. This will prevent users from uploading more than 4 files. When the files are created Multer appends an array of objects to the request accessible through req.files.

## Notes:

Future Additional Features: 
Adding a route and template for programatically creating gallery of image files. 

Original Guide references: https://www.npmjs.com/package/multer https://medium.com/@svibhuti22/file-upload-with-multer-in-node-js-and-express-5bc76073419f

Stretch goals - adding image db streaming code using MongoDb GridFS library: https://www.settletom.com/blog/uploading-images-to-mongodb-with-multer (This uses a few other tools - MongoAtlas - a backend hosting service and react)

Alternative solutions (recommended via stack-overflow) is to setup Amazon S3 Bucket https://medium.com/codebase/using-aws-s3-buckets-in-a-nodejs-app-74da2fc547a6 