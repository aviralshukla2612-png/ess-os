import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBLeZ36eGS1NlzRcHZ6WoQ69T4MbTxkrmc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ess-crm.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ess-crm",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ess-crm.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "141206567855",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:141206567855:web:c44898d871af5bbf47cd5a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2T6BE0LZZP",
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async () => {
  try {
    if (typeof window === "undefined") return null;

    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase messaging is not supported in this browser.');
      return null;
    }

    // Request notification permission if not yet granted
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission was not granted:", permission);
        return null;
      }
    }

    // Explicitly register service worker with fallback for /crmtesting basePath
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        registration = await navigator.serviceWorker.register("/crmtesting/firebase-messaging-sw.js", {
          scope: "/crmtesting/",
        });
      } catch (swErr) {
        console.warn("Failed to register SW at /crmtesting/, attempting root SW...", swErr);
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      }
    }

    const messaging = getMessaging(app);
    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
      "BNLuYAJRRRa4dJ9GXh0LWLXnw3qYFWATMUL4ePcFN-XkD1xRIks1-iXpl0uuK9iIt42O-QaPYvf08chYjAraBZw";

    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token: ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (typeof window === "undefined") return;
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
};

export default app;
