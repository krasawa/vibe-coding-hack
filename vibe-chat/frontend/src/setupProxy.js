const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend:4000',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://backend:4000',
      changeOrigin: true,
      ws: true,
    })
  );
}; 