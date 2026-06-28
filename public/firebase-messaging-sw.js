/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications when the app is closed or in background

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAkoYybhH7HouzoaBUhbilQo9ccC-g7dSM',
  authDomain: 'polla-mundialista-2026-46348.firebaseapp.com',
  projectId: 'polla-mundialista-2026-46348',
  storageBucket: 'polla-mundialista-2026-46348.firebasestorage.app',
  messagingSenderId: '857190143791',
  appId: '1:857190143791:web:fd77f513fc69a4c887f3da',
})

const messaging = firebase.messaging()

// Handle background messages (app closed or in background)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {}
  const notificationTitle = title || 'Polla Mundialista'
  const notificationOptions = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'polla-notification',
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow('/')
    })
  )
})
