"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeAttendance(room?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to same host as window
    const socketIo = io({
      path: '/socket.io',
    });

    socketIo.on('connect', () => {
      console.log('Connected to realtime server');
      if (room) {
        socketIo.emit('join', room);
      }
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [room]);

  return socket;
}
