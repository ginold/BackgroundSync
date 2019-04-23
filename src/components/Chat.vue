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
      <div class="top">
        <h2>Welcome <b>{{username}}</b></h2>
        <!-- <h3>Number of users: {{numUsers}}</h3> -->
        <div class="buttons">
          <md-button class="md-accent logout" v-on:click="logout">logout</md-button>
        <md-button class="md-accent logout install" v-on:click="install">install</md-button>
        </div>
      </div>
      <div id="messages">
        <ul>
          <li class="message"></li>
          <li class="message" v-for="m in messages">
             <md-card v-bind:class="{me: m.username === username.toString()}">
               <md-card-header-text>
                  <div class="md-subhead">{{m.username}}</div>
                  <div class="time">{{getTime()}}</div>
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

     <md-snackbar md-position="center" :md-active.sync="showSnackbar" :md-duration="duration">
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
        duration: 5000,
        installPromptEvent: null
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
          console.log('back online')
        }
        this.showSnackbar = true
      }
    },
    methods: {
      getTime() {
        let minutes = (new Date()).getMinutes()
        if (minutes < 10 ) minutes  = "0" + minutes
        return (new Date()).getHours() + ":" + minutes
      },
      goToChatArea() {
        this.showLogin = false
        io.emit('add user', this.username);
        console.log('add user client', this.username)
      },
      sendMessage() {
        let message = {message: this.message, username: this.username}
        this.messages.push(message)

        if (!navigator.onLine || this.lostConnection) {
          console.log('browser offline')
          message.offline = true
          this.saveMessage(message)
          this.message = ''     
          io.emit('stop typing')
        } else {

          this.message = ''     
          io.emit('stop typing')
          return fetch('/newMessage', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(message)
          })
          .then((response) => {
            if (response.status != 200) {
              throw new Error('Bad status code from server.');
            }
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
            console.log("success connected to db: " + db)
            resolve(db)
          }
          request.onupgradeneeded = function(event) {
            console.log("upgrade connected to db: " + db)
            let db = event.target.result
            if (!db.objectStoreNames.contains('messages')) {
              let messagesOS = db.createObjectStore("messages", { autoIncrement: true})
              messagesOS.createIndex('username', 'username', {unique: false});
            }       
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
      },
      /*
        The way of installation has changed since Chrome 70. You need to install
        it manually by going into settings. Prompt will not appear by clicking.
      */
      install() {
        window.dispatchEvent(new Event('beforeinstallprompt'))
      },
      showAddToHomeScreen() {
        // Update the install UI to notify the user app can be installed
        document.querySelector(".install").style.display = 'none'
        console.warn(
        "if 'prompt is not a function' --> The way of installation has changed since Chrome 70. You need to install it manually by going into settings. Prompt will not appear by clicking."
        )
        this.installPromptEvent.prompt()
        // Wait for the user to respond to the prompt
        this.installPromptEvent.userChoice
          .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            this.installPromptEvent = null;
          });
      }    
    },
    mounted() {
      setTimeout(() => {this.$refs.focusable.$el.focus();}, 500);
    },
    created() {
      window.addEventListener('beforeinstallprompt', (event) => {
        console.log('beforeinstallprompt')
        // Prevent Chrome <= 67 from automatically showing the prompt
        event.preventDefault()
        // Stash the event so it can be triggered later.
        this.installPromptEvent = event
        this.showAddToHomeScreen(event)
      });

      io.on('user joined', (data) => {
        console.log('user joined!')
        this.numUsers = data.numUsers
        if (data.username) {
          var joinedDiv = $('<div>', {class: 'md-card joined md-primary md-accent'}).text(data.username + " has joined!")
          $('.message:last-of-type').append(joinedDiv)          
        }
        
      })
      // Whenever the server emits 'typing', show the typing message
      io.on('typing', (data) => {
        this.typing = true
        this.name = data.username
      });
      io.on('new message', (message) => {
        console.log('message received io client')
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
.message .me {
  background: teal;
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
.top {
    display: flex;
    justify-content: space-between;
    position: relative;
    padding-right: 30px;
    width: 100%;
}
</style>
