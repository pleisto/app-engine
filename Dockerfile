FROM ghcr.io/brickdoc/app-engine-base:latest

COPY ./dist/index.js  /usr/local/index.js
COPY ./charts /usr/local/charts
ENTRYPOINT ["node", "/usr/local/index.js"]