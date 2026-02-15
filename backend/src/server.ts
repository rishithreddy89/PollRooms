import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './lib/socket';
import { errorHandler } from './middlewares/errorHandler';
import pollRoutes from './routes/polls';
import voteRoutes from './routes/votes';
import creatorRoutes from './routes/creator';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Starting server on port ${PORT} in ${NODE_ENV} mode`);

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL not set');
}

const allowedOrigins = [
  'http://localhost:3000',
  'https://poll-rooms-4dwo4f096-rishith-reddys-projects.vercel.app',
  'https://poll-rooms-xi.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.options('*', cors());

app.use(express.json());

const allowedSocketOrigins = allowedOrigins;

initSocket(server, allowedSocketOrigins);

app.use('/api/polls', pollRoutes);
app.use('/api/polls', voteRoutes);
app.use('/api/polls', statsRoutes);
app.use('/api/creator', creatorRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: NODE_ENV });
});

app.use(errorHandler);

const instance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server successfully started on port ${PORT}`);
  console.log(`✓ Listening on 0.0.0.0:${PORT}`);
  console.log(`✓ Health check available at /health`);
});

const gracefulShutdown = () => {
  instance.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
