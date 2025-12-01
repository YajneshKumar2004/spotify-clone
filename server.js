const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const LIKED_SONGS_FOLDER = path.join(__dirname, 'Liked Songs');

// Ensure the folder exists
if (!fs.existsSync(LIKED_SONGS_FOLDER)) {
  fs.mkdirSync(LIKED_SONGS_FOLDER, { recursive: true });
}

// Audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'];

function getAudioFiles() {
  if (!fs.existsSync(LIKED_SONGS_FOLDER)) {
    return [];
  }
  
  const files = fs.readdirSync(LIKED_SONGS_FOLDER);
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    })
    .sort();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (parsedUrl.pathname === '/api/songs') {
    // Return list of songs
    const songs = getAudioFiles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ songs }));
    return;
  }

  if (parsedUrl.pathname.startsWith('/Liked%20Songs/') || parsedUrl.pathname.startsWith('/Liked Songs/')) {
    // Serve audio files
    // Remove the leading slash and decode the URL
    let relativePath = decodeURIComponent(parsedUrl.pathname.substring(1)); // Remove leading '/'
    const filePath = path.join(__dirname, relativePath);
    
    // Normalize paths for comparison (handle Windows/Unix differences)
    const normalizedFilePath = path.normalize(filePath);
    const normalizedLikedSongs = path.normalize(LIKED_SONGS_FOLDER);
    
    // Security check - ensure file is in Liked Songs folder
    if (!normalizedFilePath.startsWith(normalizedLikedSongs)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(normalizedFilePath) && fs.statSync(normalizedFilePath).isFile()) {
      const stat = fs.statSync(normalizedFilePath);
      const ext = path.extname(normalizedFilePath).toLowerCase();
      
      // Determine content type based on file extension
      const contentTypes = {
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac'
      };
      
      const contentType = contentTypes[ext] || 'audio/mpeg';
      const fileStream = fs.createReadStream(normalizedFilePath);
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
      });
      
      fileStream.pipe(res);
    } else {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  
  // Security check
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.ico': 'image/x-icon'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);
    
    res.writeHead(200, { 'Content-Type': contentType });
    fileStream.pipe(res);
  } else {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Place your songs in the "Liked Songs" folder`);
  console.log(`Found ${getAudioFiles().length} song(s) in "Liked Songs" folder`);
});
