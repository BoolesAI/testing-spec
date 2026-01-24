import 'dotenv/config';
import app from './app.js';
import { disconnect } from './services/bookService.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`Bookstore API server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/v1/books`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
