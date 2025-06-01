import '../styles/styles.css';
import App from './pages/app';
import NotificationHelper from './utils/notification-helper';
import CONFIG from './config';
import AuthService from './data/auth-service';
import NotificationApiService from './data/notification-service';

async function registerServiceWorkerAndSubscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (AuthService.isLoggedIn()) {
      await subscribeToPushNotifications(registration);
    }
  } catch (error) {}
}

async function subscribeToPushNotifications(registration) {
  try {
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }
    const permissionGranted = await NotificationHelper.requestPermission();
    if (!permissionGranted) {
      return null;
    }
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });
    await NotificationApiService.subscribe(newSubscription);
    return newSubscription;
  } catch (err) {
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

document.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorkerAndSubscribePush();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  window.addEventListener('loginSuccess', async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        await subscribeToPushNotifications(registration);
    } else {
        await registerServiceWorkerAndSubscribePush();
    }
  });

  const skipLink = document.querySelector('.skip-link');
  const mainContent = document.querySelector('#main-content');

  if (skipLink && mainContent) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const firstFocusableElement = 
        mainContent.querySelector('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])') ||
        mainContent.querySelector('.story-item') ||
        mainContent;
      if (firstFocusableElement) {
        if (!mainContent.contains(firstFocusableElement) || firstFocusableElement === mainContent) {
            if (!mainContent.hasAttribute('tabindex') || mainContent.getAttribute('tabindex') !== '-1') {
              mainContent.setAttribute('tabindex', '-1');
            }
        }
        firstFocusableElement.focus();
      }
    });
  }
});