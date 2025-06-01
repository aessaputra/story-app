import RegisterPagePresenter from './register-page-presenter';
import AuthService from '../../data/auth-service';

export default class RegisterPageView {
  constructor() {
    this._presenter = new RegisterPagePresenter({ view: this, authService: AuthService });
    this._form = null;
    this._nameInput = null;
    this._emailInput = null;
    this._passwordInput = null;
    this._registerButton = null;
    this._messageElement = null;
  }

  render() {
    return `
      <section class="container auth-page">
        <h1>Register New Account</h1>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="register-name">Name</label>
            <input type="text" id="register-name" name="name" required>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" name="email" required>
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" name="password" minlength="8" required aria-describedby="password-help">
            <small id="password-help" class="form-text">Password must be at least 8 characters long.</small>
          </div>
          <button type="submit" id="register-button">Register</button>
          <p id="register-message" class="form-message" aria-live="polite"></p>
          <p class="auth-switch">Already have an account? <a href="#/login">Login here</a></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._form = document.querySelector('#register-form');
    this._nameInput = document.querySelector('#register-name');
    this._emailInput = document.querySelector('#register-email');
    this._passwordInput = document.querySelector('#register-password');
    this._registerButton = document.querySelector('#register-button');
    this._messageElement = document.querySelector('#register-message');

    this._form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this._registerButton.disabled = true;
      this._messageElement.textContent = '';
      await this._presenter.handleRegister();
      this._registerButton.disabled = false;
    });
  }

  getName() {
    return this._nameInput.value;
  }

  getEmail() {
    return this._emailInput.value;
  }

  getPassword() {
    return this._passwordInput.value;
  }

  showLoading() {
    this._messageElement.textContent = 'Processing registration...';
    this._messageElement.className = 'form-message loading';
  }

  showRegistrationSuccess(message) {
    this._messageElement.textContent = message + ' You can now login.';
    this._messageElement.className = 'form-message success';
    this._form.reset();
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 3000);
  }

  showRegistrationError(message) {
    this._messageElement.textContent = message;
    this._messageElement.className = 'form-message error';
  }

  unload() {
    // Cleanup jika ada, misalnya remove event listener jika perlu
  }
}