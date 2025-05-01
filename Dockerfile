# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev"]
