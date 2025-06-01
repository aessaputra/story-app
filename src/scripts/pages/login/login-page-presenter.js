export default class LoginPagePresenter {
  constructor({ view, authService }) {
    this._view = view;
    this._authService = authService;
  }

  async handleLogin() {
    this._view.showLoading();
    const username = this._view.getUsername();
    const password = this._view.getPassword();

    try {
      await this._authService.login(username, password);
      this._view.redirectToHome();
    } catch (error) {
      this._view.showLoginError(error.message || 'Login failed. Please check your credentials.');
    }
  }
}