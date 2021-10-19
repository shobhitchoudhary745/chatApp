const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { callbackify } = require("util");
const app = express();
const {addUser,removedUser,getUser,getUsersInRoom}=require('./utils/users')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const Filter = require("bad-words");
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));
let count = 0;
io.on("connection", (socket) => {
  console.log("new websocket connection");
 
  socket.on('join',(options,callback)=>{
    const {error,user}=addUser({id:socket.id,...options})

    if(error){
      return callback(error)
    }

    socket.join(user.room)
    socket.emit('message',generateMessage('Admin','welcome'))
  socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
  io.to(user.room).emit('roomData',{
    room:user.room,
    users:getUsersInRoom(user.room)
  })
  callback()  
})
 
  socket.on("sendMessage", (message, callback) => {
    const user=getUser(socket.id)
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username,message));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user=getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user=removedUser(socket.id)
  
  if(user){
    io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
    io.to(user.room).emit('roomData',{
      room:user.room,
      users:getUsersInRoom(user.room)
    })
  }
  });
});

server.listen(port, () => {
  console.log(`server is upon port ${port}`);
});
