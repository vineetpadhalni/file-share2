require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const cors = require('cors');
// Cors 
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3300', 'http://127.0.0.1:5500','http://127.0.0.1:5501'], // Add your allowed origins here
  methods: ['GET', 'POST'], // Add other methods you need to support
  allowedHeaders: ['Content-Type', 'Authorization'], // Add headers you want to allow
};

// Default configuration looks like
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
//   }

app.use(cors(corsOptions))
app.use(express.static('public'));

const connectDB = require('./config/db');
connectDB();

app.use(express.json());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// Routes 
app.use('/api/files', require('./routes/files'));
app.use('/files', require('./routes/show'));
app.use('/files/download', require('./routes/download'));
app.get("/messages", (req, res) => {
  res.send("Hello");
})

app.listen(PORT, console.log(`Listening on port ${PORT}.`));