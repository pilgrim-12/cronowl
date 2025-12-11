// Firebase messaging service worker for background push notifications
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBOGklaYFO_Ro75tV9spAsk43TnoT3kOvA",
  authDomain: "cronowl.firebaseapp.com",
  projectId: "cronowl",
  storageBucket: "cronowl.firebasestorage.app",
  messagingSenderId: "463568210756",
  appId: "1:463568210756:web:bcbe553955e3243c866511",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "CronOwl Alert";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: payload.data?.checkId || "cronowl-notification",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/dashboard");
      }
    })
  );
});
