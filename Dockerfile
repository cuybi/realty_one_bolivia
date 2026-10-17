FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose default port
EXPOSE 3000

# Default environment
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/La_Paz

# Run application
CMD ["npm", "start"]
