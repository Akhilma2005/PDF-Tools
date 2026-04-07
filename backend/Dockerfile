FROM node:20-slim

RUN apt-get update && apt-get install -y \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    qpdf \
    poppler-utils \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgif7 \
    libjpeg62-turbo \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/lib/libreoffice/share/gallery \
    && rm -rf /usr/lib/libreoffice/share/template \
    && rm -rf /usr/lib/libreoffice/share/autocorr

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads outputs

EXPOSE 5000

CMD ["node", "--max-old-space-size=400", "server.js"]
