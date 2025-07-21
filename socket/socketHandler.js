// socket/socketHandler.js

module.exports = (io) => {
  io.on("connection", (socket) => {
    // console.log("New client connected:", socket.id);

    // Notification-specific room join
    socket.on("join_notification_room", (role) => {
      let roomName = "";
      if (role === "admin") roomName = "admins";
      else if (role === "deliveryAgent") roomName = "deliveryAgents";
      else if (role === "customer") roomName = "customers";
      else return;

      socket.join(roomName);
    });

    // Track agent location
    socket.on("locationUpdate", (data) => {
      // console.log("Location received:", data);
      socket.broadcast.emit("locationUpdate", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
