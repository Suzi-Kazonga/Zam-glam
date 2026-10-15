// Tests run against their own database. Setting DB_NAME here, before anything imports
// src/config/db.js, is what keeps them off the real one: dotenv does not overwrite a
// variable that is already set, so the .env value for the development database is ignored.
process.env.NODE_ENV = 'test';
const testDatabase = process.env.ZAMGLAM_TEST_DB || 'zamglam_db_upload_test';
if (
  !/^zamglam_db_[a-z0-9_]+$/i.test(testDatabase)
  || (testDatabase !== 'zamglam_db_test' && !testDatabase.endsWith('_test'))
) {
  throw new Error('ZAMGLAM_TEST_DB must be zamglam_db_test or a database name ending in _test.');
}
process.env.DB_NAME = testDatabase;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// The rate limits are the thing being protected, not the thing being exercised: a suite
// that registers thirty accounts would otherwise trip the signup cap and fail for a
// reason that has nothing to do with what it is testing. rateLimit.test.js sets its own
// low limits and imports the middleware fresh, so the limiter itself is still covered.
process.env.SIGNUP_MAX = '100000';
process.env.LOGIN_MAX_ATTEMPTS = '100000';
process.env.API_MAX_PER_MINUTE = '100000';
