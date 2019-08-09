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
*/
