import CONFIG from '../config';
import AuthService from './auth-service';

const NotificationApiService = {
  async subscribe(subscription) {
    const token = AuthService.getToken();
    if (!token) {
      return Promise.reject('Authentication token not found.');
    }

    const subscriptionObject = subscription.toJSON();
    const payload = {
      endpoint: subscriptionObject.endpoint,
      p256dh: subscriptionObject.keys.p256dh,
      auth: subscriptionObject.keys.auth,
    };

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.NOTIFICATIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message || 'Failed to subscribe to Dicoding push notifications.');
      }
      return responseJson;
    } catch (error) {
      throw error;
    }
  },

  async unsubscribe(subscription) {
    const token = AuthService.getToken();
    if (!token) {
      return Promise.reject('Authentication token not found.');
    }
    if (!subscription || !subscription.endpoint) {
      return Promise.reject('Invalid subscription object.');
    }

    const payload = {
      endpoint: subscription.endpoint,
    };

    try {
      const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.NOTIFICATIONS_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message || 'Failed to unsubscribe from Dicoding push notifications.');
      }
      return responseJson;
    } catch (error) {
      throw error;
    }
  },
};

export default NotificationApiService;