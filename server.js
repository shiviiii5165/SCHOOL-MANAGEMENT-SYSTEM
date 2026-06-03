const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { loadEnvConfig } = require("@next/env");

const dev = process.env.NODE_ENV !== "production";
loadEnvConfig(process.cwd(), dev);
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  global._io = io;

  if (!global._onlineUsers) global._onlineUsers = new Map();
  if (!global._typingTimers) global._typingTimers = new Map();
  const onlineUsers = global._onlineUsers;
  const typingTimers = global._typingTimers;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join room based on user role or ID
    socket.on("join", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Attendance Events
    socket.on("attendance:submit", (data) => {
      // Broadcast to admins
      io.to("ADMIN").emit("attendance:class:submitted", data);
    });

    socket.on("attendance:absent", (data) => {
      // Send to specific parent
      if (data.parentId) {
        io.to(`PARENT_${data.parentId}`).emit("child:absent", data);
      }
      // Send to specific student
      if (data.studentId) {
        io.to(`STUDENT_${data.studentId}`).emit("attendance:updated", data);
      }
    });
    
    socket.on("attendance:detain", (data) => {
      if (data.studentId) {
        io.to(`STUDENT_${data.studentId}`).emit("student:detained", data);
      }
      if (data.parentId) {
        io.to(`PARENT_${data.parentId}`).emit("child:detained", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      
      // ── MESSAGING SYSTEM DISCONNECT ──
      const userId = socket.data?.userId;
      if (userId) {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
          }
        }
        for (const [key, timer] of typingTimers.entries()) {
          if (key.startsWith(socket.id)) {
            clearTimeout(timer);
            typingTimers.delete(key);
          }
        }
      }
    });

    // ── MESSAGING SYSTEM HANDLERS ──
    socket.on('msg:auth', async ({ userId, conversationIds }) => {
      if (!userId) return;
      socket.data.userId = userId;

      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);

      socket.join(`user:${userId}`);
      if (Array.isArray(conversationIds)) {
        conversationIds.forEach(id => socket.join(`conv:${id}`));
        conversationIds.forEach(id => {
          io.to(`conv:${id}`).emit('user:status', { userId, isOnline: true });
        });
      }
    });

    socket.on('msg:join:conv', ({ conversationId }) => {
      const userId = socket.data?.userId;
      if (!userId || !conversationId) return;
      socket.join(`conv:${conversationId}`);
    });

    socket.on('msg:typing:start', ({ conversationId }) => {
      const userId = socket.data?.userId;
      if (!userId || !conversationId) return;

      const key = `${socket.id}:${conversationId}`;
      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));

      socket.volatile.to(`conv:${conversationId}`)
        .emit('msg:typing', { userId, conversationId, isTyping: true });

      typingTimers.set(key, setTimeout(() => {
        socket.volatile.to(`conv:${conversationId}`)
          .emit('msg:typing', { userId, conversationId, isTyping: false });
        typingTimers.delete(key);
      }, 3000));
    });

    socket.on('msg:typing:stop', ({ conversationId }) => {
      const userId = socket.data?.userId;
      if (!userId || !conversationId) return;
      const key = `${socket.id}:${conversationId}`;
      if (typingTimers.has(key)) {
        clearTimeout(typingTimers.get(key));
        typingTimers.delete(key);
      }
      socket.volatile.to(`conv:${conversationId}`)
        .emit('msg:typing', { userId, conversationId, isTyping: false });
    });

    socket.on('msg:read', async ({ conversationId }) => {
      const userId = socket.data?.userId;
      if (!userId || !conversationId) return;
      
      const { prisma } = require('./lib/prisma');
      prisma.messageParticipant.updateMany({
        where: { conversationId, userId },
        data:  { lastReadAt: new Date() }
      }).catch(() => {});
      
      io.to(`conv:${conversationId}`)
        .emit('msg:read:update', { userId, conversationId });
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
