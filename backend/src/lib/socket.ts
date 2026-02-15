import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer, frontendUrl: string) => {
  io = new Server(server, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join-poll', (pollId: string) => {
      socket.join(pollId);
    });

    socket.on('leave-poll', (pollId: string) => {
      socket.leave(pollId);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
