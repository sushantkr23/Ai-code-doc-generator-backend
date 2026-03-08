import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Test data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123'
};

async function testAuth() {
    try {
        console.log('🧪 Testing Authentication APIs...\n');

        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health check:', health.data.message);

        // Test signup
        console.log('\n2. Testing signup...');
        try {
            const signup = await axios.post(`${API_BASE}/auth/signup`, testUser, {
                withCredentials: true
            });
            console.log('✅ Signup successful:', signup.data.name);
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️ User already exists, continuing with login test...');
            } else {
                console.log('❌ Signup error:', error.response?.data?.message);
            }
        }

        // Test login
        console.log('\n3. Testing login...');
        const login = await axios.post(`${API_BASE}/auth/signin`, {
            email: testUser.email,
            password: testUser.password
        }, {
            withCredentials: true
        });
        console.log('✅ Login successful:', login.data.name);

        // Test Google OAuth endpoints
        console.log('\n4. Testing Google OAuth availability...');
        try {
            const googleAuth = await axios.get(`${API_BASE}/auth/google`, {
                maxRedirects: 0,
                validateStatus: (status) => status === 302
            });
            console.log('✅ Google OAuth endpoint available');
        } catch (error) {
            if (error.response?.status === 302) {
                console.log('✅ Google OAuth endpoint available (redirecting)');
            } else {
                console.log('❌ Google OAuth error:', error.response?.data?.message);
            }
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the backend server is running on port 8000');
        }
    }
}

testAuth();