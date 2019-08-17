/* create new folder devconnector.
create .gitignore and add line: node_modules/
do git init at folder location.
do npm init at folder location.

install dependencies: npm i express express-validator bcryptjs config gravatar jsonwebtoken mongoose request
install more: npm i -D nodemon concurrently

create server.js in folder.
type code:
*/
const express = require('express');
const app = express();

// api endpoint
app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

/*
Now in package.json, remove "test" key from "scripts" and instead add:
"start": "node server",
"server": "nodemon server"
(here server is the name of file server.js)

Now save all, type command: npm run server, then open localhost:5000

also to add to git, type: 
git add .
git commit -m "initial commit"

to add code to github repo:
create an empty github repository.
use command: git remote add <repo_name> <repo_url>
then: git push <repo_name> master

now copy connection string from mongodb atlas. create new folder: config, add new file in it: default.json.
add to this file: 
{
    "mongoURI": "your connection string"
}

add another file in config folder: db.js.
add code:
*/
const mongoose = require('mongoose');
const config = require('config');

const db = config.get('mongoURI'); // fetches variable defined in default.json

const connectDB = async () => {
  try {
    await mongoose.connect(db, { useNewUrlParser: true, useCreateIndex: true });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

/*
  now to call connectDB from server.js, goto server.js and add to it:
  */
const connectDB = require('./config/db');
//connect database:
connectDB();

/*
now try: npm run server

now create folder: routes, inside it create folder: api,
then inside api folder, create files: users.js, auth.js, profile.js, posts.js
now in users.js type:
*/
const express = require('express');
const router = express.Router();

//@route GET api/users
//@desc test route
//@access Public
router.get('/', (req, res) => res.send('Users route'));

module.exports = router;

/*
similarly, do this in other files of this folder too (auth.js, profile.js, posts.js).

now in server.js, define routes in the following way:
*/
//define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

/*
Now to define schema of database, create folder: models in root directory,
then inside it create User.js to create schema for users.
In User.js, type:
*/
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('user', UserSchema);

/*
Now since we need to create users, so the api route defined in users.js should be a POST request.
So we have to change users.js in the following way (first delete everything already present in it):
*/
const express = require('express');
const router = express.Router();

//@route POST api/users
//@desc test route
//@access Public
router.post('/', (req, res) => {
  console.log(req.body); // body of POST request
  res.send('Users route');
});

module.exports = router;

/*
No in server.js, we have to initialise middleware to log request body:
*/
// Initialise middleware:
app.use(express.json({ extended: false }));

/* now you can use postman to send post request to this route
 and the request body will get displayed in the console of VS code.

 But how do we check if the request body sent by user is in correct format of name, email, password?
 We will use express-validator for this.
 in users.js, add:
*/
const { check, validationResult } = require('express-validator/check');
/*
Now modify router.post method to include validation:
*/
router.post(
  '/',
  [
    check('name', 'Name is required.')
      .not()
      .isEmpty(),
    check('email', 'Please use valid email.').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters.'
    ).isLength({ min: 6 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.send('Users route');
  }
);

/* Now save, and use postman to send post request.
If request body is NOT in the format:
{
	"name": "tarun",
	"email": "tk1234@gmail.com",
	"password": "123456" 
}
then it will display corresponding errors in response.
Otherwise, it will display "Users route" as response.

Now, we have to check if user already exists. for this, we have to convert 
(req, res) => {} to: async (req, res) => {} in users.js.
then use 'await' in further check functions. So, modify this function to:
*/
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
// ... ... ...
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // see if user exists:
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'User already exists!' }] });
    }

    // get user gravatar.
    // ... ... ...

    res.send('Users route');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
};

/*
similarly, to get gravatar, hash the password and then save the user to mongodb:
continue typing inside the try{} block above: 
*/
// get user gravatar:
const avatar = gravatar.url(email, {
  s: '200',
  r: 'pg',
  d: 'mm'
});
user = new User({
  name,
  email,
  avatar,
  password
});

const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);
await user.save();

res.send('Users registered.');

/*
Now after successful registration, we want to return an auth token as response.
For this we use jwt library. So in users.js, after the line: await user.save(),
*/
const jwt = require('jsonwebtoken');
const config = require('config');

// await user.save();
const payload = {
  user: {
    id: user.id // in mongodb, every data has an id automatically alloted.
    // we will use this id as input to token generator.
    // the generated token can be converted back to the payload.
  }
};
jwt.sign(
  payload,
  config.get('jwtSecret'), // jwtSecret phrase is stored in config.js
  { expiresIn: 3600000 }, // token expiry time.
  (err, token) => {
    if (err) throw err;
    res.json({ token }); // return token as json response to user.
  }
);

/*
Now lets create a middleware which will verify the authenticity of token.
Create folder middleware inside root, then inside middleware, create auth.js:
*/
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied!' });
  }
  // verify token:
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'token not valid!' });
  }
};

/*
Now change routes\api\auth.js to implement middleware checking of token: 
*/
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

//@route GET api/auth
//@desc test route
//@access Public
router.get('/', auth, (req, res) => res.send('Auth route')); // pass middleware as 2nd parameter.

module.exports = router;

/* 
now in GET auth route, we want to make a functionality that is person sends GET request
with token in the header, then the corresponding user details should come up,
This will help us check if a token corresponds to a valid user or not.
so in we will modify this GET api/auth code: 
*/
//@route GET api/auth
//@desc get user details corresponding to the token.
//@access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); //return every detail except password.
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

/*
Now to make login, functionality, we need to check if the credentials entered exist or not.
We do this by creating the POST api/auth route. So under GET api/auth, we define:
*/
//@route POST api/auth
//@desc authenticate user, get token
//@access Public
router.post(
  '/',
  [
    check('email', 'Please use valid email.').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters.'
    ).exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // see if user exists:
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'invalid credentials.' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'invalid credentials.' }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error.');
    }
  }
);

/*
Now define Profile schema in models folder in file Profile.js:
*/
const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  company: {
    type: String
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  bio: {
    type: String
  },
  githubusername: {
    type: String
  },

  experience: [
    {
      title: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],

  education: [
    {
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      fieldofstudy: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],

  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);

/*
then create an api route to view current users profile in routes/api/profile.js:
*/
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
//@route GET api/profile/me
//@desc get current users profile
//@access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for such user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server down.');
  }
});

module.exports = router;

/*
Now to create or update profile of a user (identified by token), we write POST api/profile route. 
*/
//@route POST api/profile/
//@desc create or update profile
//@access Private
router.post(
  '/',
  [
    auth, // token authentication using middleware.
    [
      check('status', 'Status cannot be empty.') // current status (eg. student, employee) cant be empty.
        .not()
        .isEmpty(),
      check('skills', 'Skills are required.') // listing skills is mandatory.
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(s => s.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server down.');
    }
  }
);

/*
Now let us make routes to get all profiles, and get profile by user id.
*/
//@route GET api/profile/
//@desc get all profiles
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server down.');
  }
});

//@route GET api/profile/user/:user_id
//@desc get profile by user id.
//@access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (!profile) return res.status(400).json({ msg: 'Profile not found.' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found.' });
    }
    res.status(500).send('Server down.');
  }
});

/*
Now let us create route to delete user, profi;e, and posts by token.
*/
//@route DELETE api/profile/
//@desc delete profile, user, posts by token.
//@access Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo remove posts.

    // remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // remove user
    await User.findOneAndRemove({ _id: req.user.id }); // because in User model, id is stored in key _id.

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server down.');
  }
});
