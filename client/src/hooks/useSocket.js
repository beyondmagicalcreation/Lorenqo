import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : window.location.origin;

export function useSocket({ token, role, onMessage, onTranslated, onHistory, onThreadHistory,
                            onFileList, onParticipants, onTyping, onUserOnline, onMessagesRead }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('message-history', (msgs) => onHistory?.(msgs));
    socket.on('thread-history', (data) => onThreadHistory?.(data));
    socket.on('message-received', (msg) => onMessage?.(msg));
    socket.on('message-translated', (data) => onTranslated?.(data));
    socket.on('file-list', (files) => onFileList?.(files));
    socket.on('participants-update', (data) => onParticipants?.(data));
    socket.on('typing', (data) => onTyping?.(data));
    socket.on('user-online', (data) => onUserOnline?.(data));
    socket.on('user-offline', (data) => onUserOnline?.({ ...data, online: false }));
    socket.on('messages-read', (data) => onMessagesRead?.(data));

    if (role === 'contact') {
      socket.on('connect', () => socket.emit('join'));
    }

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
