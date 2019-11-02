const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const bcrypt = require('bcryptjs')

describe.only('Users Endpoints', function() {
  let db

  const { testUsers } = helpers.makeThingsFixtures()
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers,
        )
      )

      const requiredFields = ['user_name', 'password', 'full_name']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          password: 'test password',
          full_name: 'test full_name',
          nickname: 'test nickname',
        }

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        });
      });

        it(`responds with 400 error when password is less than 8 letters`, () => {
          let userShortPassword = {
            user_name: 'test-user',
            password: '1234567',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userShortPassword)
            .expect(400, { error: `Password must be over 8 and under 72 characters`});
        })

        it(`responds with 400 error when password is over 73 characters `, () => {
          let userShortPassword = {
            user_name: 'test-user',
            password: 'X'.repeat(92),
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userShortPassword)
            .expect(400, { error: `Password must be over 8 and under 72 characters`});
        })

        it(`responds with 400 error when password begins with a space `, () => {
          let userShortPassword = {
            user_name: 'test-user',
            password: ' R13A@X2ff3',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userShortPassword)
            .expect(400, { error: `Password cannot start or end with spaces`});
        })
        
        it(`responds with 400 error when password ends with a space `, () => {
          let userShortPassword = {
            user_name: 'test-user',
            password: 'R13A@X2ff3 ',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userShortPassword)
            .expect(400, { error: `Password cannot start or end with spaces`});
        })

        it (`responds with 400 error when password is not complex enough`, () => {
          let userEasyPassword = {
            user_name: 'test-user',
            password: 'b111111EEEE',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userEasyPassword)
            .expect(400, {error: `Password must contain 1 uppercase letter, 1 lowercase letter, 1 number, and one special character`})
        });

        it(`responds with 400 error when username is already taken`, () => {
          let userTakenUsername = {
            user_name: testUser.user_name,
            password: 'X1ar@#password',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(userTakenUsername)
            .expect(400, {error: `Username is already taken`})
        })

        
      })
      context(`Happy path`, () => {
        it(`responds with 200 and the location of the new user ID`, () => {
          let newUser = {
            user_name: 'test-user',
            password: 'b111111EEEE@@',
            full_name: 'jenkins mcjenkins'
          };

          return supertest(app)
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect (res => {
              expect(res.body).to.have.property('id')
              expect(res.body.full_name).to.eql(newUser.full_name)
              expect(res.body.user_name).to.eql(newUser.user_name)
              expect(res.body.nickname).to.eql('')
              expect(res.body).to.not.have.property('password')
              expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
              const expectedDate = new Date().toLocaleTimeString('en', {timeZone: 'UTC'})
              const actualDate = new Date(res.body.date_created).toLocaleString()
              // expect(actualDate).to.eql(expectedDate);
            })
            .expect(res => 
              db
              .from('thingful_users')
              .select('*')
              .where({id: res.body.id})
              .first()
              .then(row => {
                expect(row.user_name).to.eql(newUser.user_name)
                expect(row.full_name).to.eql(newUser.full_name)
                expect(row.nickname).to.eql(null)

                return bcrypt.compare(newUser.password, row.password)
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true;
              })
            );
        })
      })
    })
  })