const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 2008;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${Date.now()}${fileExtension}`;
        cb(null, uniqueFileName);
    }
});
const upload = multer({ storage: storage });

const webhookUrl = 'https://discord.com/api/webhooks/';

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use('/upload/videos', express.static(path.join(__dirname, 'videos')));

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded or there was an upload error.');
    }

    const { originalname, filename } = req.file;
    const fileUrl = `https://api-cdn.randomassfights.live/upload/videos/${filename}`;
    const data = {
        embeds: [{
            title: 'New file uploaded',
            description: `[${originalname}](${fileUrl})`,
            color: 16711680,
            footer: { text: 'Upload Bot' }
        }]
    };

    try {
        const response = await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.status === 204) {
            return res.status(200).send(`File uploaded successfully and a link was sent to Discord! File URL: ${fileUrl}`);
        } else {
            return res.status(500).send(`Failed to send file link to Discord! HTTP Code: ${response.status}`);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Failed to send file link to Discord!');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Serving videos from: ${path.join(__dirname, 'videos')}`);
});
