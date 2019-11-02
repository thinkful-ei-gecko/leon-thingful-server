const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('Auth endpoints', () => {
  let db;

  const {testUsers} = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db',db);
  });

  after('end database connection', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/auth/login`, () => {
    beforeEach('insert users', () => 
      helpers.seedUsers(db,testUsers));

    const requiredFields = [ 'user_name', 'password'];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with 400 required error when ${field} is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, { error: `Missing '${field}' in request body`});

      });
    });

    it(`responds with 400 'invalid user_name or password' when user_name is not in database`, () => {
      const userInvalidUsername = { user_name: 'not-real-guy', password: 'exists' };

      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidUsername)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it (`responds with 400 'invalid user_name or password' when the password is wrong`, () => {
      const userInvalidPassword = { user_name: testUser.user_name, password: 'lalala' };

      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidPassword)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it(`responds with 200 and JWT auth token using secret when credentials are valid`, () =>{
      const userValidCreds = { user_name: testUser.user_name, password: testUser.password};

      const tokenExpected = jwt.sign(
        {user_id: testUser.id}, // payload
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256'
        }
      );

      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {authToken: tokenExpected});
    });

  });
});