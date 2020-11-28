// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var cors 		= require('cors')
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
const multer=require('multer')
const cloudinary=require('cloudinary').v2


var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
const Post =require('./app/models/post')

var Util = require('./app/services/UtilityService');
const user = require('./app/models/user');
const post = require('./app/models/post');


// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 3333; // used to create, sign, and verify tokens
mongoose.connect(process.env.MONGODB_URI||config.database, {
	useMongoClient: true
}); 
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

if(process.env.NODE_ENV==='production'){
	app.use(express.static('client/build'))
}

// use morgan to log requests to the console
app.use(morgan('dev'));



/**
*
*
* CORS support 
*
**/
app.use(cors())



// =================================================================
// routes ==========================================================
// =================================================================
app.get('/', function(req, res) {
	res.send('Hello! The API is at http://localhost:' + port + '/api');
});


app.get('/seed', function(req, res) {

	var nick = new User({ 
		name: 'mitchy1', 
		email: 'nick.mitchell1@beamenergylabs.com',
		password: 'password',
		admin: true 
	});
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});


/**
*
* Register
* Create a user 
*
*/
app.post('/register', function(req, res) {

	var errorCheck = Util.checkForErrors(req.body);
	if(errorCheck.hasErrors){
		console.log('There were errors...');
		res.json(errorCheck.errors);
		return;
	}


	// create a sample user
	var user = new User({ 
		name: req.body.name, 
		email: req.body.email,
		password: req.body.password,
		admin: req.body.admin
	});
	user.save(function(err) {

		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});







// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router(); 

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://URL/api/authenticate
var login = function(req, res) {

	// find the user
	User.findOne({
		// name: req.body.name,
		email: 		req.body.email,
		password: 	req.body.password
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create a token
				var payload = {
					admin: user.admin	
				}
				var token = jwt.sign(payload, app.get('superSecret'), {
					expiresIn: 86400 // expires in 24 hours
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		

		}

	});
}
apiRoutes.post('/authenticate', login);
apiRoutes.post('/login', login);

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
// setting up multer -------------------------
const  storage = multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  });
  const imageFilter = function (req, file, cb) {
      // accept image files only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
  };
  const upload = multer({ storage: storage, fileFilter: imageFilter})

  // setting up cloudinary which will host the uploaded files
  
  cloudinary.config({ 
    cloud_name: '----------', //in these three lines host's credentials will come from his cloudinary account.
    api_key: "-------------------", 
    api_secret:"-------------------" 
});



apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome !' });
});

/////////////////// post routes

apiRoutes.get('/posts', function(req, res) {
	Post.find({}, function(err, users) {
		res.json(users);
	});
});

apiRoutes.post('/post',upload.single('avatar'),async function(req, res) {  //upload is the middelware provided by multer which will have uploaded files.
	const post =new Post({user:user._id})
	cloudinary.uploader.upload(req.file.path,async function(result){
		profile.profilepic=result.secure_url
		await profile.save()
		res.send(result.secure_url)
	})
   await post.save()
});

apiRoutes.delete('/post/:id',async()=>{

	const post=await Post.findOneAndDelete({_id:req.params.id})
	await post.save()
} )

app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('server up at http://localhost:' + port);
