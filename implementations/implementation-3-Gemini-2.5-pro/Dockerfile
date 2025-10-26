# Dockerfile for the AI Agent
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3020

# Command to run the application
CMD [ "node", "src/index.js" ]
