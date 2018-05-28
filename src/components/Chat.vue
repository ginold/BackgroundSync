<template>
  <main id="chat-app">

    <section id="login" v-if="showLogin">
      <h2>Best chat ever</h2>
      <md-button class="md-raised md-primary" v-on:click="goToChatArea">JOIN</md-button>
      <md-field>
        <label>Login name</label>
        <md-input ref="focusable" v-on:keyup.enter="goToChatArea" v-model="username"></md-input>
      </md-field>
    </section>

    <section id="chatArea" v-else>
      <h2>Welcome <b>{{username}}</b></h2>
      <h3>Number of users: {{numUsers}}</h3>
      <md-button class="md-accent logout" v-on:click="logout">logout</md-button>
      <div id="messages">
        <ul>
          <li class="message"></li>
          <li class="message" v-for="m in messages">
             <md-card>
               <md-card-header-text>
                  <div class="md-subhead">{{m.username}}</div>
                  <div class="time">{{ (new Date()).getHours()}}:{{(new Date()).getMinutes()}}</div>
              </md-card-header-text>
              <md-card-content>
                <span>{{m.message}}</span>
                <img v-if="m.offline" class="offline" src="/static/img/loading.gif">
              </md-card-content>
            </md-card>
          </li>
        </ul>
      </div>
      <h4 v-if="typing" class="typing"><b>{{name}}</b> is typing...</h4>
      <md-field id="messageInput">
        <label>Type message</label>
        <md-input v-on:keyup="emitTyping" v-on:keyup.enter="sendMessage" v-model="message"></md-input>
      </md-field>
    </section>

     <md-snackbar md-position="center" :md-active.sync="showSnackbar" md-persistent :md-duration="duration">
      <span>{{snackbarText}}</span>
      <md-button class="md-primary">Ok</md-button>
    </md-snackbar>
    <BackgroundSync></BackgroundSync>

  </main>
</template>

<script>
  import BackgroundSync from './BackgroundSync'
  import $ from "jquery";
  import ioClient from 'socket.io-client'
  let io = ioClient()

  export default {
    name: 'Chat',
    data () {
      return {
        name: null,
        typing: false,
        username: null,
        showLogin: true,
        message: null,
        snackbarText: '',
        numUsers: 1,
        messages: [],
        lostConnection: false,
        showSnackbar: false,
        duration: 5000
      }
    },
    components: {BackgroundSync},
    watch: {
      lostConnection: function(val) {
        if (val) {
          this.snackbarText = 'Connection timeout. Showing limited messages!'
        } else {
          this.snackbarText = "You're back online!"
          // remove offline indicator
          let request = indexedDB.open("messagesDB", 1)
          console.log('back online')
        }
        this.showSnackbar = true
      }
    },
    methods: {
      goToChatArea() {
        this.showLogin = false
        io.emit('add user', this.username);
        console.log('add user client', this.username)
      },
      sendMessage() {
        let message = {message: this.message, username: this.username}
        this.messages.push(message)
        if (!navigator.onLine || this.lostConnection) {
          message.offline = true
          this.saveMessage(message)
          this.message = ''     
          io.emit('stop typing')
        } else {
          io.emit('new message', message)
          io.emit('stop typing')
          this.message = ''     
          return fetch('/newMessage', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(message)
          })
          .then((response) => {
            if (response.status != 200) {
              throw new Error('Bad status code from server.');
            }
            //io.emit('new message', message)
            return response
          })     
        }
      },
      saveMessage(message) {
        // the object properties should match what is in createIndex
        this.openDB().then((db)=> {
          let tx = db.transaction('messages', 'readwrite') // table objectStoreNames
          let store = tx.objectStore('messages')
          store.add(message)
          console.log('message saved! ' + message.message)
          return tx.complete 
        })
      },
      openDB() {
       let promise = new Promise((resolve, reject) => {   
          let request = window.indexedDB.open("messagesDB", 1)
          request.onerror = function(event) {
            console.warn("Why didn't you allow my web app to use IndexedDB?!");
          };
          request.onsuccess = function(event) {
            let db = event.target.result;
            console.log("connected to db: " + db)
            resolve(db)
          }
          request.onupgradeneeded = function(event) {
            let db = event.target.result
            if (!db.objectStoreNames.contains('messages')) {
              let messagesOS = db.createObjectStore("messages", { autoIncrement: true})
              messagesOS.createIndex('username', 'username', {unique: false});
            }       
            resolve(db)      
             // add messages here when update or change db
          }
       })   
       return promise;         
      },
      emitTyping() {
        if (navigator.onLine && !this.lostConnection) {
          io.emit('typing', this.username)
        }
      },
      logout() {
        io.emit('disconnect', true)
        io.emit('stop typing')
        this.showLogin = true
        this.username = null
      }    
    },
    mounted() {
      setTimeout(() => {this.$refs.focusable.$el.focus();}, 500);
    },
    created() {
      io.on('user joined', (data) => {
        console.log('user joined!')
        this.numUsers = data.numUsers
        if (data.username) {
          var joinedDiv = $('<div>', {class: 'md-card joined md-primary md-accent'}).text(data.username + " has joined!")
          $('.message:last-of-type').prepend(joinedDiv)          
        }
        
      })
      // Whenever the server emits 'typing', show the typing message
      io.on('typing', (data) => {
        this.typing = true
        this.name = data.username
      });
      io.on('new message', (message) => {
        //console.log('message received io client')
        if (message.username != this.username) {
          this.messages.push(message)
        }
        if (message.offline) {
          setTimeout(() => {$('.offline').remove()}, 500)  
        }
      })
      // Whenever the server emits 'stop typing', kill the typing message
      io.on('stop typing', (data) => {
        this.typing = false
      });
      io.on('disconnect', () => {
        console.log('you have been disconnected');
        if (!this.showLogin) {
          this.lostConnection = true
          io.emit('stop typing')
        }
      });
      io.on('user left', (data) => {
        console.log(' user left ' + data.numUsers)
        this.numUsers = data.numUsers
        io.emit('stop typing')
      })
      io.on('reconnect', () => {
        console.log('you have been reconnected');
        io.emit('add user', this.username);
        this.lostConnection = false
      });
      io.on('reconnect_error', () => {
        this.lostConnection = true
        console.log('attempt to reconnect has failed');
      });
      window.addEventListener('online', () => this.lostConnection = false)
      window.addEventListener('offline', () => this.lostConnection = true )   
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

main {
    height: 100vh;
    display: flex;
}
#login {
  width: 100%;
    margin: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
}
#chatArea {    
    overflow: auto;
    width: 100%;
    height: 90vh;
    margin: 0 30px;
}
.message {
  display: block;
  margin-top: 10px;
}
.md-card-header-text {
  display: flex;
  justify-content: space-between;
}
.md-card-content {
  padding: 10px;
  display: flex;
  justify-content: space-between;
}
.md-subhead, .time {
  margin: 5px 10px !important;
}
#messageInput{ 
  position: fixed;
  bottom: 0;
  width: calc(100% - 30px);
  left: 0;
  margin-left: 10px;
}
.offline {
  height: 25px !important;
}
.logout {
  position: absolute;
  right: 10px;
  top: 20px;
}
.typing {
  color: burlywood;
}
.joined {
  margin-top: 10px;
  padding: 10px;              
  background-color: black;
}
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #35495E;
}
</style>
