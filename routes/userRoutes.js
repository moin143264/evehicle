const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Your User model
const nodemailer = require("nodemailer");
const moment = require('moment-timezone');
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Middleware to authenticate the token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", ""); // Get token from the Authorization header
  if (!token) return res.status(403).send("Access denied");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Access denied");
    req.user = user; // Attach user info to the request object
    next();
  });
};

// In-memory storage for OTPs
const otpStore = new Map();

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP for registration
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: `"EV Charging Office" <${process.env.EMAIL_USER}>`, // Custom sender name
    to: email,
    subject: "Registration OTP",
    text: `Your OTP for registration is: ${otp}`,
  };

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await transporter.sendMail(mailOptions);
    otpStore.set(email, { otp, timestamp: Date.now() });

    // Set OTP expiration to 5 minutes
    setTimeout(() => {
      otpStore.delete(email);
    }, 300000);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP for registration
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ error: "OTP expired or not found" });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  if (Date.now() - storedData.timestamp > 300000) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP expired" });
  }

  otpStore.delete(email);
  res.status(200).json({ success: true });
});

// Register a new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validate email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (!otp) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, { otp: generatedOtp, timestamp: Date.now() });

      const mailOptions = {
        from: `"EV Charging Office" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Login OTP",
        text: `Your OTP for login is: ${generatedOtp}`,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "OTP sent successfully", requireOtp: true });
    }

    const storedOtp = otpStore.get(email);
    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (Date.now() - storedOtp.timestamp > 300000) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    otpStore.delete(email);
    const token = generateToken(user._id, "user");

    res.json({
      token,
      name: user.name,
      role: "user",
      _id: user._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login process failed" });
  }
});

// Fetch user profile data
router.get("/user-profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    res.status(200).send({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Update user profile data
router.put("/update-profile", authenticateToken, async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).send({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Reset Password
router.post('/reset', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).send('User not found');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    res.send('Password has been updated');
  } catch (error) {
    res.status(500).send('Error updating password');
  }
});

module.exports = router;
