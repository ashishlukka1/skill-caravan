const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Use morgan for concise request logging
app.use(morgan("dev"));

// Custom middleware to log request body for POST/PATCH/PUT after body parsing
app.use((req, res, next) => {
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    console.log("Body:", req.body);
  }
  next();
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth"); 
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user");
app.use("/api/users", userRoutes);

const courseRoutes = require("./routes/Course");
app.use("/api/courses", courseRoutes);

const progressRoutes = require("./routes/Progress");
app.use("/api/progress", progressRoutes);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
