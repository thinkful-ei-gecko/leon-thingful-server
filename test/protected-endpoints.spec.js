const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('Protected endpoints', () => {
  let db;

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.DB_URL
    });
    app.set('db',db);
  });

  after('end database connection', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  beforeEach('insert things', () =>
  helpers.seedThingsTables(
    db,
    testUsers,
    testThings,
  )
)

  let protectedEndpoints = [
    {
      path: '/api/things/1',
      name: `GET '/api/things/:thing_id'`,
      method: supertest(app).get
    },
    {
      path: '/api/things/1/reviews',
      name: `GET '/api/things/:thing_id/reviews`,
      method: supertest(app).get
    },
    {
      path: '/api/reviews',
      name: `POST '/api/reviews`,
      method: supertest(app).post
    }
  ];
  protectedEndpoints.forEach(endpoint => {

  describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token present`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token`});
      });

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        let user = testUsers[0]
        const invalidSecret = 'bad-secret';
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(user, invalidSecret))
          .expect(401, { error: 'Unauthorized request'});
      });

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        let user = { user_name: 'bad-userrrrr', password: 'exists' };
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(user))
          .expect(401, {error: `Unauthorized request`});

      });
  });

  });
});