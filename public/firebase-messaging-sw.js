importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// We don't have access to process.env in the service worker directly, 
// so you must fill these in manually or use a script to inject them.
// For now, replacing these placeholders before deploying is required.
firebase.initializeApp({
  apiKey: "your_api_key_here",
  authDomain: "ess-crm.firebaseapp.com",
  projectId: "ess-crm",
  storageBucket: "ess-crm.appspot.com",
  messagingSenderId: "your_sender_id_here",
  appId: "your_app_id_here",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
