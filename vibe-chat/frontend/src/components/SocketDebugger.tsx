import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import socketService from '../services/socketService';

const SocketDebugger: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    // Check connection status every second
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const handleConnect = () => {
    addLog('Attempting to connect...');
    socketService.init();
  };

  const handleDisconnect = () => {
    addLog('Disconnecting...');
    socketService.disconnect();
  };

  const handleReconnect = () => {
    addLog('Attempting to reconnect...');
    socketService.reconnect();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Paper sx={{ p: 2, m: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Socket Debug Panel
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Connection Status: 
          <Typography 
            component="span" 
            color={isConnected ? 'success.main' : 'error.main'}
            fontWeight="bold"
            sx={{ ml: 1 }}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={handleConnect}>
          Connect
        </Button>
        <Button size="small" variant="outlined" onClick={handleDisconnect}>
          Disconnect
        </Button>
        <Button size="small" variant="outlined" onClick={handleReconnect}>
          Reconnect
        </Button>
        <Button size="small" variant="outlined" onClick={clearLogs}>
          Clear Logs
        </Button>
      </Box>

      <Box>
        <Typography variant="body2" gutterBottom>
          Logs:
        </Typography>
        <Box 
          sx={{ 
            height: 200, 
            overflow: 'auto', 
            bgcolor: 'grey.100', 
            p: 1, 
            borderRadius: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No logs yet...
            </Typography>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SocketDebugger; 