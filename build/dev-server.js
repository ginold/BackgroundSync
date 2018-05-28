'use strict'
// const http = require('http');
// const express = require('express');
// const path = require('path')
// const webpack = require('webpack');
// const webpackConfig = require('./webpack.dev.conf');
// const compiler = webpack(webpackConfig);
// const config = require('../config')
// const opn = require('opn')

// // Create the app, setup the webpack middleware
// const app = express();
// app.use(require('webpack-dev-middleware')(compiler, {
//   noInfo: true,
//   publicPath: webpackConfig.output.publicPath,
// }));
// app.use(require('webpack-hot-middleware')(compiler));

// const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
// app.use(staticPath, express.static('./static'))

// const server = http.Server(app);
// const io = require('socket.io')(server);

// server.listen(8080)

// io.on('connection', (socket) => {
//   console.log('qweqe')
//   alert('qweq')
//   console.debug(socket)
//   socket.emit('mappy:playerbatch', playerbatch);
// });

require('./check-versions')()

const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

const opn = require('opn')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const webpackConfig = require('./webpack.dev.conf')
const app = express()
const http = require('http')
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
const autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

const compiler = webpack(webpackConfig)

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// serve webpack bundle output
app.use(devMiddleware)


// enable hot-reload and state-preserving
// compilation error display
app.use(require('webpack-hot-middleware')(compiler));

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  let options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

const uri = 'http://localhost:' + port
let _resolve
const readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}

////////////////////////////////////////////////////////////////////

const server = http.Server(app);
const io = require('socket.io')(server);
server.listen(8080)

var globalUsername;
var numUsers = 0
var addedUser = false
var socketGlobal = null

var subscription = null
const webpush = require('web-push');
const vapidKeys = {
  public: 'BNhgMx4Y7AcBMQZZnaA_ZASxIBepztyQ1MX6pUFgzx5k0S5kiCfMOYUeXnBJJ5o6NXKzKWihtXOhBhXKq6EfFKc',
  private: 'Y3KoHvLuDppueLD2D5DIX5jPOnowEZfqUfJY7AwCjc0'
}

webpush.setVapidDetails('mailto:test@test.com', vapidKeys.public, vapidKeys.private)

// Subscribe Route
app.post("/subscribe", (req, res) => {
  // Get pushSubscription object BODY PARSER REQUIRED
  subscription = req.body;
  // Create payload
  const payload = JSON.stringify({ title: "You have subscribed!", url: uri });
  // Pass object into sendNotification
  // webpush
  //   .sendNotification(subscription, payload)
  //   .then(() => {
  //     res.sendStatus(200)      
  //   })
  //   .catch((err) => {
  //     res.sendStatus(400) 
  //     console.log(err)
  //   });
  // Send 201 - resource created
});

app.post("/newMessage", (req, res) => {
  if (subscription) {
    // Get pushSubscription object BODY PARSER REQUIRED
    const message = req.body;
    console.log(message.message)
      // Create payload
    const payload = JSON.stringify({ message: message.message, username: message.username});
    // Pass object into sendNotification
    webpush
      .sendNotification(subscription, payload)
      .then(() => {
        res.sendStatus(200)
        console.log('sending server new message')
        if (message.offline) {
          console.log('offline message')
          // EMITS TO EVERYONE IN ROOM CHAT
          io.in('chat').emit('new message', {
            username: message.username,
            message: message.message,
            offline: true
          });
        }
      })
      .catch((err) => {
        res.sendStatus(400) 
        console.log(err)
      });        
  } else {
    console.log('subscription is not defined')
  }
});

io.on('connection', (socket) => {onConnect(socket)});
    
function onConnect(socket){
  console.log('connected ' + socket.id);
  socket.join('chat')
  socket.on('disconnect', (logout) => {onDisconnect(socket)});
  socket.on('add user', (username) => {onAddUser(socket, username)})
  socket.on('new message', (data) => {onNewMessage(socket, data)})
  socket.on('typing', (username) => {onTyping(socket, username)})
  socket.on('stop typing', () => {onStopTyping(socket)})
}
function onNewMessage(socket, data) {
  // we tell the client to execute 'new message'
  socket.broadcast.emit('new message', {
    username: socket.username,
    message: data.message
  });
}
function onAddUser(socket, username) {
  // when the client emits 'add user', this listens and executes
  // we store the username in the socket session for this client
  socket.username = username;
  globalUsername = username
  ++numUsers;
  addedUser = true;
  socketGlobal = socket

  console.log('add user server')
  console.log(socket.username, numUsers)
  // echo globally (all clients) that a person has connected
  socket.broadcast.emit('user joined', {
    username: socket.username,
    numUsers: numUsers
  });
}
function onDisconnect(socket, logout) {
  console.log('user disconnect')
  --numUsers;
  // echo globally that this client has left
  socket.broadcast.emit('user left', {
    username: socket.username,
    numUsers: numUsers
  });
  if (!logout) {
    socket.disconnect(true)
  }
}
function onStopTyping(socket) {
  socket.broadcast.emit('stop typing');
}
function onTyping(socket) {
  socket.broadcast.emit('typing', { username: socket.username });
}