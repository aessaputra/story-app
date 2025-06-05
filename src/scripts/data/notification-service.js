import CONFIG from '../config';
import AuthService from './auth-service';

const NotificationApiService = {
  async subscribe(subscription) {
    const token = AuthService.getToken();
    if (!token) {
      console.error('Push Subscription Error: Authentication token not found.');
      return Promise.reject(new Error('Authentication token not found.'));
    }

    const subscriptionObject = subscription.toJSON();
    const payload = {
      endpoint: subscriptionObject.endpoint,
      keys: {
        p256dh: subscriptionObject.keys.p256dh,
        auth: subscriptionObject.keys.auth,
      },
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
      if (!response.ok || responseJson.error) {
        const errorMessage = responseJson.message || `Failed to subscribe to push notifications. Status: ${response.status}`;
        console.error('Push Subscription Error:', errorMessage, responseJson);
        throw new Error(errorMessage);
      }
      console.log('Push notification subscribed successfully:', responseJson);
      return responseJson;
    } catch (error) {
      console.error('Network or other error during push subscription:', error);
      throw error;
    }
  },

  async unsubscribe(subscription) {
    const token = AuthService.getToken();
    if (!token) {
      console.error('Push Unsubscription Error: Authentication token not found.');
      return Promise.reject(new Error('Authentication token not found.'));
    }
    if (!subscription || !subscription.endpoint) {
      console.error('Push Unsubscription Error: Invalid subscription object.');
      return Promise.reject(new Error('Invalid subscription object for unsubscribe.'));
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
      if (!response.ok || responseJson.error) {
        const errorMessage = responseJson.message || `Failed to unsubscribe from push notifications. Status: ${response.status}`;
        console.error('Push Unsubscription Error:', errorMessage, responseJson);
        throw new Error(errorMessage);
      }
      console.log('Push notification unsubscribed successfully:', responseJson);
      return responseJson;
    } catch (error) {
      console.error('Network or other error during push unsubscription:', error);
      throw error;
    }
  },
};

export default NotificationApiService;