const express = require("express");
const socket = require("socket.io");
const axios = require("axios");

// App setup
const PORT = 5000;
const app = express();
const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "views");

// Socket setup
const io = socket(server);
const listRooms = [];
io.on("connection", (socket) =>{

  socket.on("logging", (user) => {
    console.log(`${user} connected.`)
    console.log("user: " + socket.id);
  })

  socket.on("clientRequests", (id, username) => {
    io.sockets.in(socket.Phong).emit("serverResponse",  id, username);
    let url = `http://localhost:8080/seat/selectSeatById/${id}/${username}`;

    axios.put(url);
    

  })

  socket.on("reload", (id)=>{
    socket.emit("reloadResponse", id)
  })

  socket.on("client", (seat) => {
    if (seat.seatStatus.id === 2) {
      console.log(`${seat.user.username} selected seat have id: ${seat.seat_id}`);
    } else {
      console.log(`${seat.user.username} unselected seat have id: ${seat.seat_id}`)
    }
  })

  socket.on("create-room", (data) => {
    socket.join(data);
    socket.Phong = data;
    if (listRooms.indexOf(data) >= 0) {
    } else {
        listRooms.push(data);
    }
    console.log("listRooms", listRooms);
    io.sockets.emit("server-send-rooms", listRooms);
    socket.emit("server-send-room-socket", data);
});

  socket.on("disconnect", () => {
    console.log("User disconnected")
  })
});






app.get("/", (req, res) => {
  res.render("login");
});

app.get("/app", (req, res) => {
  res.render("app");
});
