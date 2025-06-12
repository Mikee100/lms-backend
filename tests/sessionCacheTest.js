const axios = require('axios').default;
const assert = require('assert');

async function testSessionPersistence() {
  try {
    // Login request to create session
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'testuser',
      password: 'testpassword'
    }, {
      withCredentials: true
    });

    assert.strictEqual(loginResponse.status, 200, 'Login failed');

    const cookies = loginResponse.headers['set-cookie'];
    assert(cookies, 'No cookies set on login');

    // Use the cookie to make an authenticated request
    const apiResponse = await axios.get('http://localhost:5000/api/students/profile', {
      headers: {
        Cookie: cookies.join(';')
      },
      withCredentials: true
    });

    assert.strictEqual(apiResponse.status, 200, 'Authenticated request failed');
    console.log('Session persistence test passed.');
  } catch (error) {
    console.error('Session persistence test failed:', error.message);
  }
}

testSessionPersistence();
