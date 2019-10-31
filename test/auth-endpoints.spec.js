const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Auth endpoints', () => {
  let db;

  const {testUsers} = helpers.makeArticlesFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db.knex({
      client: 'pg',
      connection: process.env.DB_URL
    });
    app.set('db',db);
  });

  after('end database connection', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe(`POST /api/auth/login`, () => {
    beforeEach('insert users', () => 
      helpers.seedUsers(db,testUsers));

    it('has a test');

  });
});