# ─── STAGE 1: builder ─────────────────────────
FROM node:22-slim AS builder
WORKDIR /usr/src/app

# 1. Copy package files and install ALL deps
COPY package*.json ./
RUN npm ci

# 2. Copy source & build
COPY . .
RUN npm run build

# ─── STAGE 2: runner ──────────────────────────
FROM node:22-slim AS runner
WORKDIR /usr/src/app

# 3. Install system Chromium + required libraries
RUN apt-get update && apt-get install -y \
  chromium \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  lsb-release \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# 4. Copy package files again and install ONLY prod deps
COPY package*.json ./
ENV NODE_ENV=production
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
RUN npm install --omit=dev

# 5. Copy compiled NestJS app from builder
COPY --from=builder /usr/src/app/dist ./dist

# 6. Tell Puppeteer where to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 7. Launch the app
CMD ["node", "dist/src/main.js"]
