export default class HomePagePresenter {
  constructor({ view, storyApiModel }) {
    this._view = view;
    this._storyApiModel = storyApiModel;
  }

  async loadStories() {
    this._view.showLoading();
    try {
      const stories = await this._storyApiModel.getAllStories();
      this._view.displayStories(stories);
    } catch (error) {
      this._view.showError(error.message || 'Failed to retrieve stories from the server.');
    }
  }
}