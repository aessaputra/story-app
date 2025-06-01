export default class RegisterPagePresenter {
  constructor({ view, authService }) {
    this._view = view;
    this._authService = authService;
  }

  async handleRegister() {
    this._view.showLoading();
    const name = this._view.getName();
    const email = this._view.getEmail();
    const password = this._view.getPassword();

    if (password.length < 8) {
      this._view.showRegistrationError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const result = await this._authService.register(name, email, password);
      if (!result.error) {
        this._view.showRegistrationSuccess(result.message);
      } else {
        this._view.showRegistrationError(result.message || 'An unknown error occurred during registration.');
      }
    } catch (error) {
      this._view.showRegistrationError(error.message || 'Registration failed. Please try again.');
    }
  }
}