const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');

// Test route to verify if files.js is loaded correctly
router.get('/test', (req, res) => {
  res.send('Test route is working');
});

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({
  storage,
  limits: { fileSize: 1000000 * 100 },
}).single('myfile'); // 100mb

router.post('/', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send({ error: err.message });
    }
    if (!req.file) {
      console.error('No file received');
      return res.status(400).send({ error: 'No file uploaded' });
    }
    console.log('File uploaded successfully:', req.file);
    const file = new File({
      filename: req.file.filename,
      uuid: uuidv4(),
      path: req.file.path,
      size: req.file.size,
    });
    try {
      const response = await file.save();
      console.log('File saved to database:', response);
      res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).send({ error: 'Error saving file info to database' });
    }
  });
});

router.post('/send', async (req, res) => {
  const { uuid, emailTo, emailFrom, expiresIn } = req.body;
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: 'All fields are required except expiry.' });
  }
  // Get data from db 
  try {
    const file = await File.findOne({ uuid });
    if (file.sender) {
      return res.status(422).send({ error: 'Email already sent once.' });
    }
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();
    // send mail
    const sendMail = require('../services/mailService');
    sendMail({
      from: emailFrom,
      to: emailTo,
      subject: 'inShare file sharing',
      text: `${emailFrom} shared a file with you.`,
      html: require('../services/emailTemplate')({
        emailFrom,
        downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email`,
        size: `${parseInt(file.size / 1000)} KB`,
        expires: '24 hours',
      }),
    }).then(() => {
      return res.json({ success: true });
    }).catch(err => {
      return res.status(500).json({ error: 'Error in email sending.' });
    });
  } catch (err) {
    return res.status(500).send({ error: 'Something went wrong.' });
  }
});

module.exports = router;
