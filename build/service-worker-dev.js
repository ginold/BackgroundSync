// // This service worker file is effectively a 'no-op' that will reset any
// // previous service worker registered for the same host:port combination.
// // In the production build, this file is replaced with an actual service worker
// // file that will precache your site's local assets.
// // See https://github.com/facebookincubator/create-react-app/issues/2272#issuecomment-302832432


// // importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js');

// // if (workbox) {
// // 	console.log(`Yay! Workbox is loaded 🎉`);
// // 	console.log(self.__precacheManifest)
// // 	workbox.precaching.precacheAndRoute(self.__precacheManifest || []);


// // 	const bgSyncPlugin = new workbox.backgroundSync.Plugin('sendPendingRequests', {
// // 	  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
// // 	});

// // 	workbox.routing.registerRoute(
// // 	  /\/api\/.*\/*.json/,
// // 	  workbox.strategies.networkOnly({
// // 	    plugins: [bgSyncPlugin]
// // 	  }),
// // 	  'POST'
// // 	);
// // } else {
// //   console.log(`Boo! Workbox didn't load 😬`);
// // }

// let defaultIcon = 'static/img/icons/android-chrome-192x192.png'

// // activated when server sends a message
// self.addEventListener('push', (event) => {
//   console.log('Received a push message', event.data.json());

//   const data = event.data.json()

//   let title
//   let body
//   let icon
//   // create message notification
//   if (data.username) {
// 	  title = data.username + ' has sent a message!'
// 	  body = data.message
// 	  icon = 'static/img/user.png'
//   // create subscription notification
//   } else if (data.title) {
// 	  title = data.title
// 	  body = 'We have received a subscription.'
// 	  icon = defaultIcon
//   }
//   event.waitUntil(
//     self.registration.showNotification(title, {
//       body: body, icon: icon, data: data, vibrate: [200, 100, 200]
//     })
//   );

// });
// self.addEventListener('sync', function(event) {
//   if (event.tag == 'pendingRequests') {
//   	console.log('sync fired !')
// 	let message = {title: 'BackgroundSync activated', body: 'Messages will be sent!'}
//     event.waitUntil(sendPendingRequests());
//   	event.waitUntil(
//     	self.registration.showNotification(message.title, {
//       		body: message.body, icon: defaultIcon, vibrate: [200, 100, 200]
//     }))    
//   }
// });

// /* The fetch event of a service worker is fired for every single
// request the page makes.  The fetch event also allows you to 
// serve alternate content than was actually requested.  */
// self.addEventListener('fetch', e => {
//   console.log('fetch called')
//   console.log(e.request.url);
//   e.respondWith(caches.match(e.request).then(function(response) {
//       return response || fetch(e.request)
//     })
//   );
// })
// self.addEventListener('activate', event => {
//   console.log('activate called')
//   const currentCaches = [PRECACHE, RUNTIME];
//   event.waitUntil(
//     caches.keys().then(cacheNames => {
//       return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
//     }).then(cachesToDelete => {
//       return Promise.all(cachesToDelete.map(cacheToDelete => {
//         return caches.delete(cacheToDelete);
//       }));
//     }).then(() => self.clients.claim())
//   );

//   self.clients.matchAll({ type: 'window' }).then(windowClients => {
//     for (let windowClient of windowClients) {
//       // Force open pages to refresh, so that they have a chance to load the
//       // fresh navigation response from the local dev server.
//       windowClient.navigate(windowClient.url);
//     }
//   });
// })


// var PRECACHE = 'precache-v1';
// var RUNTIME = 'runtime';

// // list the files you want cached by the service worker
// PRECACHE_URLS = [
//   'index.html',
//   './',
//   'style.css',
//   'main.js'
// ];
// /*
//  The ServiceWorkerGlobalScope.skipWaiting() method of the
//  ServiceWorkerGlobalScope forces the waiting service worker
//  to become the active service worker.
//  Use this method with Clients.claim() to ensure that
//  updates to the underlying service worker take effect
//  immediately for both the current client and all other active clients.
// */
// self.addEventListener('install', event => {
// 	console.log('install called')
// 	self.skipWaiting();
// 	caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(self.skipWaiting())
// })
// self.addEventListener('notificationclose', event => {
// })
// self.addEventListener('notificationclick', event => {
//   console.log(event);
//   event.notification.close();
//   // This looks to see if the current is already open and  
//   // focuses if it is  
//   event.waitUntil(
//     clients.matchAll({  
//       type: "window"  
//     })
//     .then(function(clientList) {  
//       for (var i = 0; i < clientList.length; i++) { 
//         var client = clientList[i];  
//         if (client.url == '/' && 'focus' in client)  
//           return client.focus();  
//       }  
//       if (clients.openWindow) {
//         return clients.openWindow(event.notification.data.url);  
//       }
//     })
//   );
// })
// self.addEventListener('message', event => {
// })

// function sendPendingRequests() {
// 	console.log('sendPendingRequests...')
//     let request = indexedDB.open("messagesDB", 1)
//     request.onsuccess = function(event) {
//     	let messages;
// 		let db = event.target.result
// 		let tx = db.transaction('messages', 'readwrite')
// 		let store = tx.objectStore('messages')
// 		store.getAll().onsuccess = function(event) {
// 			messages = event.target.result
// 			console.log(messages)
// 			// send array!
// 			for (let m of messages) {
// 				fetch('/newMessage', {
// 		            method: 'POST',
// 		            headers: {'Content-Type': 'application/json'},
// 		            body: JSON.stringify(m)
// 		        })
// 			}      
// 		}
// 		return
//     }
//     request.onerror = function(e) {
//        console.warn("SW DB error " + e);    	
//     }
//     return
// }

// function checkIfAlreadyOpenTab() {

// }