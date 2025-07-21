FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install necessary dependencies for Puppeteer to run headless Chrome.
RUN apt-get update \
    && apt-get install -yq --no-install-recommends \
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
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    # Clean up the apt-get cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Build your NestJS application
RUN npm run build

# Your app will run on port 3000, so expose it
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "run", "start:prod"]
