# ParseLab-server met Chromium, klaar voor Railway, Render, Fly.io of een eigen server.
#   docker build -t parselab . && docker run -p 8080:8080 -v parselab-data:/app/server/data parselab
FROM mcr.microsoft.com/playwright:v1.56.0-noble
WORKDIR /app
COPY server/package.json server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY . .
ENV PARSELAB_PORT=8080 NODE_ENV=production
EXPOSE 8080
VOLUME ["/app/server/data"]
CMD ["node", "server/server.js"]
