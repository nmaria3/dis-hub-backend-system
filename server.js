const dotenv = require("dotenv").config()
const express = require('express');
const app = express();
const db = require("./config/db");

// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('Server is running 🚀');
});

// Example API route
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to your backend API'
    });
});

// Port
const PORT = 5000 || process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});