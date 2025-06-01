import CONFIG from '../config';
import AuthService from './auth-service';

const StoryApiModel = {
  async getAllStories(page = 1, size = 10, location = 1) {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please login.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (location === 1) {
        params.append('location', '1');
    }
    
    const queryString = params.toString();

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.STORIES_ENDPOINT}?${queryString}`, { headers });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message || 'Failed to fetch stories');
      }
      return responseJson.listStory || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  async addNewStory(storyData) {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please login to add a story.');
    }

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.STORIES_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: storyData,
      });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message || 'Failed to add new story');
      }
      return responseJson;
    } catch (error) {
      console.error('Error adding new story:', error);
      throw error;
    }
  },

  async getStoryDetail(id) {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please login.');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.STORIES_ENDPOINT}/${id}`, { headers });
      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message || `Failed to fetch story detail for ID: ${id}`);
      }
      return responseJson.story;
    } catch (error) {
      console.error(`Error fetching story detail for ID: ${id}:`, error);
      throw error;
    }
  }
};

export default StoryApiModel;