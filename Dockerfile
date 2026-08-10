FROM node:22-bookworm-slim
WORKDIR /app
COPY . /app
ENV HOST=0.0.0.0 PORT=8787 DATA_DIR=/data PUBLIC_DIR=/app
VOLUME ["/data"]
EXPOSE 8787
CMD ["node","server/server.js"]
