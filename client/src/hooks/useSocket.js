import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : window.location.origin;

export function useSocket({ token, role, onMessage, onTranslated, onHistory, onThreadHistory,
                            onFileList, onParticipants, onTyping, onUserOnline, onMessagesRead,
                            onReconnecting }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      onReconnecting?.(false);
      if (role === 'contact') socket.emit('join');
    });

    socket.on('disconnect', (reason) => {
      // Only show reconnecting for server-side or transport drops, not manual disconnects
      if (reason !== 'io client disconnect') {
        onReconnecting?.(true);
      }
    });

    socket.on('message-history', (msgs) => onHistory?.(msgs));
    socket.on('thread-history', (data) => onThreadHistory?.(data));
    socket.on('new-message', (msg) => onMessage?.(msg));
    socket.on('message-translated', (data) => onTranslated?.(data));
    socket.on('file-list', (files) => onFileList?.(files));
    socket.on('participants-update', (data) => onParticipants?.(data));
    socket.on('typing', (data) => onTyping?.(data));
    socket.on('user-online', (data) => onUserOnline?.(data));
    socket.on('user-offline', (data) => onUserOnline?.({ ...data, online: false }));
    socket.on('messages-read', (data) => onMessagesRead?.(data));

    return () => { socket.disconnect(); };
  }, [token, role]);

  const sendContactMessage = useCallback((content) => {
    socketRef.current?.emit('send-message', { content });
  }, []);

  const sendAdminMessage = useCallback((projectId, targetContactId, content, language) => {
    socketRef.current?.emit('send-message', { projectId, targetContactId, content, language });
  }, []);

  const joinProject = useCallback((projectId) => {
    socketRef.current?.emit('join-project', { projectId });
  }, []);

  const getThread = useCallback((projectId, contactId) => {
    socketRef.current?.emit('get-thread', { projectId, contactId });
  }, []);

  const sendContactFileMessage = useCallback((fileData) => {
    socketRef.current?.emit('file-message', fileData);
  }, []);

  const sendAdminFileMessage = useCallback((projectId, targetContactId, fileData) => {
    socketRef.current?.emit('file-message', { projectId, targetContactId, ...fileData });
  }, []);

  const sendContactTyping = useCallback((isTyping) => {
    socketRef.current?.emit('typing', { isTyping });
  }, []);

  const sendAdminTyping = useCallback((projectId, targetContactId, isTyping) => {
    socketRef.current?.emit('typing', { projectId, targetContactId, isTyping });
  }, []);

  return {
    sendContactMessage, sendAdminMessage,
    joinProject, getThread,
    sendContactFileMessage, sendAdminFileMessage,
    sendContactTyping, sendAdminTyping,
  };
}
