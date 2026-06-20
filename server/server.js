require('dotenv').config();
const http = require('http');
const app = require('./app');

const { initDb } = require('./config/db');

const port = process.env.PORT || 3000;
app.set('port', port);

const server = http.createServer(app);

// Initialize database, then start listening
initDb().then(() => {
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
