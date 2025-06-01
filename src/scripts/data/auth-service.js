import CONFIG from '../config';

const AuthService = {
  async register(name, email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.REGISTER_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message || 'Registration failed');
      }
      return responseJson;
    } catch (error) {
      console.error('AuthService Register Error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message || 'Login failed');
      }
      
      if (responseJson.loginResult && responseJson.loginResult.token) {
        this.setToken(responseJson.loginResult.token);
        localStorage.setItem('storyAppName', responseJson.loginResult.name);
        localStorage.setItem('storyAppUserId', responseJson.loginResult.userId);
        return responseJson.loginResult;
      }
      throw new Error('Login response did not contain token.');

    } catch (error) {
      console.error('AuthService Login Error:', error);
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem('storyAppToken');
  },

  setToken(token) {
    localStorage.setItem('storyAppToken', token);
  },

  getUserName() {
    return localStorage.getItem('storyAppName');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('storyAppToken');
    localStorage.removeItem('storyAppName');
    localStorage.removeItem('storyAppUserId');
  },
};

export default AuthService;