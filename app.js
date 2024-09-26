const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your DB username
    password: '', // Replace with your DB password
    database: 'music_player'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // Serve uploads directory as static files
app.set('view engine', 'ejs');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Redirect the home page to view songs
app.get('/', (req, res) => {
    res.redirect('/view-songs');
});

// Route to serve the Add Song page
app.get('/add-song', (req, res) => {
    res.render('index');
});

// Add song
app.post('/add-song', upload.fields([{ name: 'mp3' }, { name: 'album_photo' }]), (req, res) => {
    const { title, lyrics } = req.body;
    const mp3 = req.files['mp3'][0].filename;
    const album_photo = req.files['album_photo'][0].filename;

    const sql = 'INSERT INTO songs (title, lyrics, mp3, album_photo) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, lyrics, mp3, album_photo], (err) => {
        if (err) throw err;
        res.redirect('/view-songs');
    });
});

// View all songs
app.get('/view-songs', (req, res) => {
    db.query('SELECT * FROM songs', (err, results) => {
        if (err) throw err;
        res.render('view-songs', { songs: results });
    });
});

// View song details
app.get('/song/:id', (req, res) => {
    const songId = req.params.id;
    db.query('SELECT * FROM songs WHERE id = ?', [songId], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.render('song-detail', { song: results[0] });
        } else {
            res.status(404).send('Song not found');
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Delete song
app.post('/delete-song/:id', (req, res) => {
    const songId = req.params.id;
    const sql = 'DELETE FROM songs WHERE id = ?';

    db.query(sql, [songId], (err) => {
        if (err) throw err;
        res.redirect('/view-songs');
    });
});
