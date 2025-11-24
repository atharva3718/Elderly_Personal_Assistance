import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes & Models
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import assistantRoutes from "./routes/assistant.js";
import customerRoutes from "./routes/customerRoutes.js";
import notificationRoutes from "./routes/notification.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

import Message from "./models/Message.js";

const app = express();
const server = http.createServer(app);

// 🔐 Check essential environment variables
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

// 🌐 CORS Setup (single definition)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// 📦 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔌 Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`👤 User joined: ${userId}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      const message = new Message({ senderId, receiverId, content });
      await message.save();

      const receiverSocket = onlineUsers[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId,
          content,
          timestamp: new Date(),
        });
      }
      console.log(`📨 Message from ${senderId} → ${receiverId}: ${content}`);
    } catch (error) {
      console.error("❌ Message save error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});

// 🩺 Health Check API
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 📌 Routes
app.use("/user", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/assistants", assistantRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/appointments", appointmentRoutes);

// 🛢 MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // retry faster in Docker
  })
  .then(() => console.log("🟢 MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// 🚀 Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
