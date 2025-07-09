const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/1inch-proxy',
    createProxyMiddleware({
      target: 'https://api.1inch.dev',
      changeOrigin: true,
      pathRewrite: {
        '^/1inch-proxy': '',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Set the API key from the environment variable
        proxyReq.setHeader('Authorization', `Bearer ${process.env.REACT_APP_1INCH_API_KEY}`);
      },
    })
  );
}; 