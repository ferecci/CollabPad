#!/usr/bin/env node

const { setupWSConnection } = require('y-websocket/bin/utils');
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Official y-websocket server running on ws://${HOST}:${PORT}`);
  console.log('Ready for collaborative editing with full awareness support!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
});

module.exports = { server, wss };
