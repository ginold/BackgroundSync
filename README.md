# Offline Chat App

This app uses SocketIO, Vue.js, Node and Background Sync API. It works only with a restricted number of browsers: https://caniuse.com/#search=background%20sync

## Highlights the user's message and if some other user is currently typing
![alt text](https://user-images.githubusercontent.com/7814311/56588768-4bca2a80-65e4-11e9-945d-31cb891e80af.png)

## if you turn off or lose your internet connection and type a message, an indicator on the right side of the message and a snackbar with information will appear. The messages will be saved to IndexDB. This might require to reload the page a second time in order to work properly.
![alt text](https://user-images.githubusercontent.com/7814311/56588910-9481e380-65e4-11e9-8243-b412541d6aba.png)

## Now you can even close your tab, the messages should be sent once the browser detects you're online again.
![alt text](https://user-images.githubusercontent.com/7814311/56588768-4bca2a80-65e4-11e9-945d-31cb891e80af.png)

## Notifications
![alt text](https://user-images.githubusercontent.com/7814311/56589082-da3eac00-65e4-11e9-9e26-1dac1b158087.png)


## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

