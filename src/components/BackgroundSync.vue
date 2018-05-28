<template>
</template>
<script>
  import $ from "jquery";
  import ioClient from 'socket.io-client'
  let io = ioClient()

  export default {
    name: 'BackgroundSync',
    data () {
      return {
      	  isOnline: true,
      	  swReg: null,	
      	  publicKey: 'BNhgMx4Y7AcBMQZZnaA_ZASxIBepztyQ1MX6pUFgzx5k0S5kiCfMOYUeXnBJJ5o6NXKzKWihtXOhBhXKq6EfFKc'
      }
    },
    watch: {
    	isOnline: function(isOnline) {
    		if (!isOnline) this.registerSync() 
    	}
    },
    methods: {
    	urlBase64ToUint8Array(base64String, text) {
		  const padding = "=".repeat((4 - base64String.length % 4) % 4);
		  const base64 = (base64String + padding)
		    .replace(/\-/g, "+")
		    .replace(/_/g, "/");

		  const rawData = window.atob(base64);
		  const outputArray = new Uint8Array(rawData.length);

		  for (let i = 0; i < rawData.length; ++i) {
		    outputArray[i] = rawData.charCodeAt(i);
		  }
		  return outputArray;
		},
		displayNotification(reg, text) {
		  if (Notification.permission == 'granted') {
		      var options = {
		        body: text.body,
		        icon: 'static/img/icons/favicon-32x32.png',
		        vibrate: [100, 50, 100],
		        data: {}
		      };
		      reg.showNotification(text.title, options);
		  } else {
			this.askPermissionNotification().then(() => {
				this.displayNotification(reg, text)}) 	
		  }
		},
		sendSubscriptionToBackend(subscription) {
		  return fetch('/subscribe', {
		    method: 'POST',
		    headers: {'Content-Type': 'application/json'},
		    body: JSON.stringify(subscription)
		  })
		  .then(function(response) {
		    if (response.status != 200) {
		      throw new Error('Bad status code from server.');
		    }
		    return response
		  })			
		},
		askPermissionNotification() {
		  return new Promise(function(resolve, reject) {
		    const permissionResult = Notification.requestPermission(function(result) {
		      resolve(result);
		    });
		    if (permissionResult) {
		      permissionResult.then(resolve, reject);
		    }
		  })
		  .then(function(permissionResult) {
		    if (permissionResult !== 'granted') {
		      throw new Error('We weren\'t granted permission.');
		    }
		  });
		},
		registerSync() {
			setTimeout(() => {
				console.log('sync register fired')
				this.swReg.sync.register('pendingRequests')
			}, 1000)
		}
    },
    created() {
	window.addEventListener('load', () => {
	    window.addEventListener('online', () => this.isOnline = true)
	    window.addEventListener('offline', () => this.isOnline = false) 
	})
	if ('serviceWorker' in navigator && 'PushManager' in window) {
		  // Use the window load event to keep the page load performant
		let register = navigator.serviceWorker.register('static/sw/sw.js')

	    register.then((swReg) => { 
	    	this.swReg = swReg
			console.log('Service Worker is registered', swReg);
			this.askPermissionNotification()
			const subscription = {
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
			}
			console.log("Push Registered...")
			return swReg.pushManager.subscribe(subscription)
		})
		.then((pushSubscription) => {
		    let sub = JSON.stringify(pushSubscription)
		    let subParsed = JSON.parse(sub)
		    const subscriptionObject = {
			  endpoint: subParsed.endpoint,
			  keys: {
			    p256dh: subParsed.keys.p256dh,
			    auth: subParsed.keys.auth
			  }
			};
			this.sendSubscriptionToBackend(subscriptionObject)
		    return pushSubscription			
		})
		.catch(function(error) {
		    console.error('Service Worker Error', error);
		});

    } else {
	  console.warn('Push messaging is not supported');
	}

    }
  }
</script>