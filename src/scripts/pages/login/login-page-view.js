import LoginPagePresenter from './login-page-presenter';
import AuthService from '../../data/auth-service';

export default class LoginPageView {
  constructor() {
    this._presenter = new LoginPagePresenter({ view: this, authService: AuthService });
    this._form = null;
  }

  render() {
    return `
      <section class="container auth-page">
        <h1>Login</h1>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="username">Username/Email</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" id="login-button">Login</button>
          <p id="login-message" class="form-message" aria-live="polite"></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._form = document.querySelector('#login-form');
    this._loginButton = document.querySelector('#login-button');
    this._messageElement = document.querySelector('#login-message');

    this._form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this._loginButton.disabled = true;
      this._messageElement.textContent = '';
      await this._presenter.handleLogin();
      this._loginButton.disabled = false;
    });
  }

  getUsername() {
    return document.querySelector('#username').value;
  }

  getPassword() {
    return document.querySelector('#password').value;
  }

  showLoading() {
    this._messageElement.textContent = 'Processing login...';
    this._messageElement.className = 'form-message loading';
  }

  showLoginError(message) {
    this._messageElement.textContent = message;
    this._messageElement.className = 'form-message error';
  }

  redirectToHome() {
    this._messageElement.textContent = 'Login successful! Redirecting...';
    this._messageElement.className = 'form-message success';
    
    // Kirim custom event bahwa login berhasil
    window.dispatchEvent(new CustomEvent('loginSuccess'));

    setTimeout(() => {
      window.location.hash = '#/';
      // window.dispatchEvent(new HashChangeEvent("hashchange")); // Tidak perlu, perubahan hash sudah cukup
    }, 1500);
  }

  unload() {
    // Cleanup jika ada
  }
}