import api from './client';

async function testConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const health = await api.get('/health');
    console.log('✅ Health check:', health.data);
    
    // Test registration (will likely fail but shows connection works)
    try {
      const register = await api.post('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        city: 'Bangalore',
        state: 'Karnataka'
      });
      console.log('✅ Registration response:', register.data);
    } catch (error: any) {
      console.log('❌ Registration failed (expected):', error.response?.data || error.message);
    }
    
    console.log('\n✅ API connection successful!');
  } catch (error: any) {
    console.error('❌ API connection failed:', error.message);
  }
}

testConnection();
