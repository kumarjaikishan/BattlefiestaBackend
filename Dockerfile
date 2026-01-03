FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
