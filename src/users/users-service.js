const xss = require('xss');
const bcrypt = require('bcryptjs')

const UsersService = {
  hasUserWithUsername(db, user_name) {
    return db('thingful_users').where('user_name',user_name).first()
      .then(user => !!user);
  },
  insertUser(db,user) {
    return db.insert(user).into('thingful_users').returning('*')
      .then(([user]) => {
        return user;
      });
  },
  serializeUser(user) {
    return {
      id: user.id,
      full_name: xss(user.full_name),
      user_name: xss(user.user_name),
      nickname: xss(user.nickname),
      date_created: new Date(user.date_created),
    };
  },
  hashPassword(password) {
    return bcrypt.hash(password,12);
  }
};

module.exports = UsersService;