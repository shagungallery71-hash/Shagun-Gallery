FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better Docker cache)
COPY package*.json ./

# ✅ Fix dependency conflicts
RUN npm install --legacy-peer-deps

# Copy rest of the application code
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
