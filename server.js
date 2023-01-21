const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
var helmet = require("helmet");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { readdirSync } = require("fs");
const dotenv = require("dotenv");
const { handleNotFound } = require("./utils/helper");
const { errorHandler } = require("./middlewares/error");
dotenv.config();
const apiRoutes = require("./routes/apiRoutes");
const app = express();

const httpServer = createServer(app);

// const io = require("socket.io")(), {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
global.io = new Server(httpServer);

app.use(helmet());

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// app.use(
//   fileUpload({
//     useTempFiles: true,
//   })
// );
//routes
// readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));

app.use("/api", apiRoutes);

app.use("/*", handleNotFound);

app.use(errorHandler);

// Normal Chat App
let users = [];
const addUser = (userId, socketId, userInfo) => {
  const checkUser = users.some((u) => u.userId === userId);

  if (!checkUser) {
    users.push({ userId, socketId, userInfo });
  }
};
const userRemove = (socketId) => {
  users = users.filter((u) => u.socketId !== socketId);
};

const findFriend = (id) => {
  return users.find((u) => u.userId === id);
};

const userLogout = (userId) => {
  users = users.filter((u) => u.userId !== userId);
};
//-----------------------------

// ----------------------------
// Chat for e commerce users

const admins = [];
let activeChats = [];
function get_random(array) {
  return array[Math.floor(Math.random() * array.length)];
}

io.on("connection", (socket) => {
  socket.on("admin connected with server", (adminName) => {
    admins.push({ id: socket.id, admin: adminName });
  });
  socket.on("client sends message", (msg) => {
    if (admins.length === 0) {
      socket.emit("no admin", "");
    } else {
      let client = activeChats.find((client) => client.clientId === socket.id);
      let targetAdminId;
      if (client) {
        targetAdminId = client.adminId;
      } else {
        let admin = get_random(admins);
        activeChats.push({ clientId: socket.id, adminId: admin.id });
        targetAdminId = admin.id;
      }
      socket.broadcast
        .to(targetAdminId)
        .emit("server sends message from client to admin", {
          user: socket.id,
          message: msg,
        });
    }
  });

  socket.on("admin sends message", ({ user, message }) => {
    socket.broadcast
      .to(user)
      .emit("server sends message from admin to client", message);
  });

  socket.on("admin closes chat", (socketId) => {
    socket.broadcast.to(socketId).emit("admin closed chat", "");
    let c = io.sockets.sockets.get(socketId);
    c.disconnect(); // reason:  server namespace disconnect
  });

  socket.on("disconnect", (reason) => {
    // admin disconnected
    const removeIndex = admins.findIndex((item) => item.id === socket.id);
    if (removeIndex !== -1) {
      admins.splice(removeIndex, 1);
    }
    activeChats = activeChats.filter((item) => item.adminId !== socket.id);

    // client disconnected
    const removeIndexClient = activeChats.findIndex(
      (item) => item.clientId === socket.id
    );
    if (removeIndexClient !== -1) {
      activeChats.splice(removeIndexClient, 1);
    }
    socket.broadcast.emit("disconnected", {
      reason: reason,
      socketId: socket.id,
    });
    // Normal chat app
    userRemove(socket.id);
    io.emit("getUser", users);
  });
  // end chat for e commerce users
  //--------------------------------

  //--------------------------------
  // Chat App Socket
  //  Add User
  socket.on("addUser", (userId, userInfo) => {
    addUser(userId, socket.id, userInfo);
    io.emit("getUser", users);

    const us = users.filter((u) => u.userId !== userId);
    const con = "new_user_add";
    for (var i = 0; i < us.length; i++) {
      socket.to(us[i].socketId).emit("new_user_add", con);
    }
  });
  // Send Message
  socket.on("sendMessage", (data) => {
    const user = findFriend(data.receiverId);

    if (user !== undefined) {
      socket.to(user.socketId).emit("getMessage", data);
    }
  });
  // Message Seen
  socket.on("messageSeen", (msg) => {
    const user = findFriend(msg.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("msgSeenResponse", msg);
    }
  });

  //Delivered Message
  socket.on("deliveredMessage", (msg) => {
    const user = findFriend(msg.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("msgDeliveredResponse", msg);
    }
  });
  //Seen message
  socket.on("seen", (data) => {
    const user = findFriend(data.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("seenSuccess", data);
    }
  });
  // Typing indicator
  socket.on("typingMessage", (data) => {
    const user = findFriend(data.receiverId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("typingMessageGet", {
        senderId: data.senderId,
        receiverId: data.receiverId,
        msg: data.msg,
      });
    }
  });
  //Logout
  socket.on("logout", (userId) => {
    userLogout(userId);
  });
  //Disconnect
  // socket.on("disconnect", () => {
  //   console.log("user is disconnected... ");
  //   userRemove(socket.id);
  //   io.emit("getUser", users);
  // });
  // Close Chat App Socket
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.json({ message: "API running..." });
  });
}

app.use((error, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
  next(error);
});
app.use((error, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  } else {
    res.status(500).json({
      message: error.message,
    });
  }
});

//database
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("database connected successfully"))
  .catch((err) => console.log("error connecting to mongodb", err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`server is running on port ${PORT}..`)
);
// app.listen(PORT, () => {
//   console.log(`server is running on port ${PORT}..`);
// });
