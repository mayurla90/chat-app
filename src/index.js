const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter =  require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser,getUser,getUsersInRoom,removeUser}  = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

// setup static directory to serve
app.use(express.static(publicDirectoryPath))

 

io.on('connection', (socket) => {
    console.log('new web socket connection')
    
    socket.on('join', (options,callback) => {
      const {error,user} = addUser({id: socket.id,...options})
      
      if(error) {
       return callback(error)
      }

      socket.join(user.room)
      socket.emit('message', generateMessage('Admin','welcome'))
      socket.broadcast.to(user.room).emit('message',generateMessage( 'Admin' ,` ${user.username} has joined`))
      
      io.to(user.room).emit('roomData',{
          'room': user.room,
          'users': getUsersInRoom(user.room)
      })

      callback()
    })


    socket.on('sendMessage', (msg,callback) => {
        const user = getUser(socket.id)
        const filter = new Filter();

        if(filter.isProfane(msg)){
            return callback('profanity is not allowed')
        }
            io.to(user.room).emit('message',generateMessage(user.username ,msg))
            callback()        
    })
    
    socket.on('sendLocation', (locationObj,callback) => {
        const user = getUser(socket.id)
        const msgUrl = `https://www.google.com/maps?q=${locationObj.Location.lat},${locationObj.Location.long}`
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, msgUrl))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin' ,`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                'room': user.room,
                'users': getUsersInRoom(user.room)
            })
      
        }        
    })
   
})

server.listen(port, () => {
    console.log('server started on port ' + port)
})