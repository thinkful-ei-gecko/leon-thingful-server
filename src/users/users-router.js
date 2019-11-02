const express = require('express');
const jsonParser = express.json();
const path = require('path');
const UsersService = require('./users-service');
const usersRouter = express.Router();

let REGEX_STRING = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;
usersRouter
  .post('/',jsonParser,(req,res,next) => {
    let { password, user_name, nickname, full_name } = req.body;
    let newUser = {password, user_name, nickname, full_name, date_created: 'now()' };
    for (const field of ['password','user_name','full_name']) {
      if (!req.body[field]) {
        return res.status(400).json({error: `Missing '${field}' in request body`})
      }
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({error: `Password must be over 8 and under 72 characters`});
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return res.status(400).json({error: `Password cannot start or end with spaces`});
    }
    if (!REGEX_STRING.test(password)) {
      return res.status(400).json({error: `Password must contain 1 uppercase letter, 1 lowercase letter, 1 number, and one special character`});
    }

    UsersService.hasUserWithUsername(req.app.get('db'),user_name)
      .then(response => {
        if (response) {
          return res.status(400).json({error: `Username is already taken`})
        }
        else {
          UsersService.hashPassword(password)
            .then(hashedPassword => {
              newUser.password = hashedPassword;
            })
            .then(() => {

          UsersService.insertUser(req.app.get('db'),newUser)
            .then(user => {
              return res.status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(UsersService.serializeUser(user));
            });
          })
        }
      })
      .catch(next);
  });


module.exports = usersRouter;