# Use the official Node.js image.
# Held at >=22.18.0: @hey-api/openapi-ts declares that as its minimum engine.
FROM node:22.22.3-alpine3.22

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
