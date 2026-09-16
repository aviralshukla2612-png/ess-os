importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// We don't have access to process.env in the service worker directly, 
// so you must fill these in manually or use a script to inject them.
// For now, replacing these placeholders before deploying is required.
firebase.initializeApp({
  apiKey: "AIzaSyBLeZ36eGS1NlzRcHZ6WoQ69T4MbTxkrmc",
  authDomain: "ess-crm.firebaseapp.com",
  projectId: "ess-crm",
  storageBucket: "ess-crm.firebasestorage.app",
  messagingSenderId: "141206567855",
  appId: "1:141206567855:web:c44898d871af5bbf47cd5a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'ESS OS Notification';
  const iconUrl = self.location.origin + '/crmtesting/ess-logo.png';
  const targetUrl = payload.data?.linkUrl || payload.fcmOptions?.link || '/crmtesting/attendance';

  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: iconUrl,
    badge: iconUrl,
    data: {
      url: targetUrl,
      ...payload.data
    },
    requireInteraction: true,
    tag: `ess-push-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Fallback listener for raw push events
self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.data?.title || 'ESS OS Alert';
    const body = data.notification?.body || data.data?.message || '';
    const iconUrl = self.location.origin + '/crmtesting/ess-logo.png';
    const targetUrl = data.data?.linkUrl || '/crmtesting/attendance';

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: iconUrl,
        badge: iconUrl,
        data: { url: targetUrl, ...data.data },
        requireInteraction: true,
        tag: `ess-raw-${Date.now()}`,
        renotify: true,
        vibrate: [200, 100, 200]
      })
    );
  } catch (e) {
    // Handled by messaging.onBackgroundMessage
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/crmtesting/attendance';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/crmtesting') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
