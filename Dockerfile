# Use official Node.js LTS image
FROM node:18

# Install Python for running Assignment.py
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
