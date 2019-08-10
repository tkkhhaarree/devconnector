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
    await mongoose.connect(db, { useNewUrlParser: true });
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
