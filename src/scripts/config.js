// story-app/src/scripts/config.js

/**
 * Konfigurasi global untuk aplikasi Story App.
 * Berisi URL dasar API, endpoint spesifik, dan VAPID public key untuk push notifications.
 */
const CONFIG = {
  // URL dasar untuk API Dicoding Story
  BASE_URL: 'https://story-api.dicoding.dev/v1',

  // Endpoint untuk registrasi pengguna baru
  REGISTER_ENDPOINT: '/register',

  // Endpoint untuk login pengguna
  LOGIN_ENDPOINT: '/login',

  // Endpoint untuk operasi terkait cerita (mendapatkan semua cerita, menambah cerita baru, detail cerita)
  STORIES_ENDPOINT: '/stories',

  // Endpoint untuk berlangganan dan berhenti berlangganan push notification web
  NOTIFICATIONS_ENDPOINT: '/notifications/subscribe',

  // VAPID Public Key yang disediakan oleh API Dicoding untuk Web Push Notifications.
  // Key ini digunakan oleh browser untuk mengenkripsi langganan push
  // dan oleh server aplikasi untuk mengirim notifikasi secara aman.
  VAPID_PUBLIC_KEY: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',
};

export default CONFIG;
