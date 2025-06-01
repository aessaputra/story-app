const NotificationHelper = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications.');
      return false;
    }

    const status = await Notification.requestPermission();
    return status === 'granted';
  },

  async showNotification({ title, options }) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted.');
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        alert('You need to grant notification permission to receive updates.');
        return;
      }
    }

    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
      console.warn('Service worker not ready for showing notification.');
      // Fallback to simple notification if SW not ready (less ideal for PWA)
      // new Notification(title, options); // Ini tidak akan berfungsi jika tab ditutup
      alert('Service worker not ready. Notification might not work as expected.');
      return;
    }
    
    // Menampilkan notifikasi melalui Service Worker
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    await serviceWorkerRegistration.showNotification(title, options);
    console.log('Notification shown via Service Worker');
  },

  // Fungsi ini akan dipanggil oleh Service Worker
  async _displayNotificationFromSW(event) {
    const notifTitle = event.data.json().title;
    const notifOptions = event.data.json().options;
    
    event.waitUntil(
      self.registration.showNotification(notifTitle, {
        ...notifOptions,
        icon: notifOptions.icon || '/icons/icon-192x192.png', // Default icon
        badge: notifOptions.badge || '/icons/icon-192x192.png', // Default badge
      })
    );
  }
};

export default NotificationHelper;