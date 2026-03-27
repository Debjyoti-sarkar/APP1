require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// File upload middleware for voice assistant (multipart/form-data)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory temporarily
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// Make upload middleware available globally
app.use((req, res, next) => {
  // Apply multer for audio uploads
  if (req.path.includes("/assistant/")) {
    upload.single("audio")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("🚨 Multer error:", err);
        return res.status(400).json({ error: err.message });
      } else if (err) {
        console.error("🚨 File upload error:", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  } else {
    next();
  }
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/ml", require("./routes/mlRoutes"));
app.use("/api/fraud-alerts", require("./routes/fraudRoutes"));
app.use("/api/loans", require("./routes/loanRoutes"));
app.use("/api/emi", require("./routes/emiRoutes"));
app.use("/api/qr", require("./routes/qrRoutes"));
app.use("/api/offline-otp", require("./routes/offlineOtpRoutes"));
app.use("/api/otp", require("./routes/otpRoutes")); // Real OTP
app.use("/api/aadhaar", require("./routes/aadhaarRoutes")); // Aadhaar Verification
app.use("/api/spam", require("./routes/spamRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/assistant", require("./routes/assistantRoutes")); // Voice Assistant
app.use("/api/behavioral", require("./routes/behavioralRoutes")); // Behavioral Analytics (BAA)

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "KAVACH Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      transactions: "/api/transactions",
      ml: "/api/ml",
      fraudAlerts: "/api/fraud-alerts",
      loans: "/api/loans",
      emi: "/api/emi",
      qr: "/api/qr",
      offlineOtp: "/api/offline-otp",
      otp: "/api/otp",
      aadhaar: "/api/aadhaar",
      spam: "/api/spam",
      notifications: "/api/notifications",
      activity: "/api/activity",
      user: "/api/user",
      assistant: "/api/assistant", // Voice Assistant
      behavioral: "/api/behavioral", // Behavioral Analytics (BAA)
    },
  });
});

const PORT = process.env.PORT || 5000;

// Listen on all network interfaces (0.0.0.0) for Android emulator access
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 KAVACH Backend Server started on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`🌐 Network Interfaces: All (0.0.0.0)`);
});
