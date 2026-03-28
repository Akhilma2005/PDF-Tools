FROM node:20-slim

RUN apt-get update && apt-get install -y \
    libreoffice \
    qpdf \
    poppler-utils \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads outputs

EXPOSE 5000

CMD ["node", "server.js"]
