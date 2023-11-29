FROM node:18 as builder

WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy rest of the files
COPY . .

# Build the project
RUN npm run build


