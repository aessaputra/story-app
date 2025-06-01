export default class AddStoryPagePresenter {
  constructor({ view, storyApiModel }) {
    this._view = view;
    this._storyApiModel = storyApiModel;
  }

  async submitNewStory(storyData) {
    if (!storyData) return;

    this._view.showLoading();
    try {
      await this._storyApiModel.addNewStory(storyData);
      this._view.showSuccess('Story successfully shared!');
    } catch (error) {
      this._view.showError(error.message || 'Failed to share story. Please try again.');
    }
  }
}