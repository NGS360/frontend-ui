# Use the official Node.js image
FROM node:22.16.0-alpine3.22

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the project files
COPY . .

# Expose the port React runs on
EXPOSE 8080

# Run the React application
CMD ["npm", "run", "dev"]
