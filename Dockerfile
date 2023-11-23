FROM node:20 as builder

WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Copy rest of the files
COPY . .

CMD npm run test