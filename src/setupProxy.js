const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://comitedeaguasangaspartl.com",
      changeOrigin: true,
      secure: true,
    })
  );
};
