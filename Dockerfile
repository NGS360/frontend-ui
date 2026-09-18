# Use the official Node.js image.
# Held at >=22.18.0: @hey-api/openapi-ts declares that as its minimum engine.
FROM node:22.22.3-alpine3.22

# Set the working directory
WORKDIR /app

# Install dependencies. Both files, and `npm ci` rather than `npm install`, so
# this image resolves the same tree the lockfile pins and CI installs.
#
# With package.json alone, npm re-resolved every caret range at image build
# time, so the container drifted ahead of the lockfile and dev ran a different
# dependency tree than CI -- meaning a bug could reproduce in one and not the
# other. It showed up as src/routeTree.gen.ts never staying clean:
# @tanstack/router-plugin is pinned to 1.120.18 but resolved to 1.168.35 here,
# and the two emit different identifiers for the same routes, so the dev
# server's codegen rewrote the committed file on every boot.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the project files
COPY . .

# Expose the port React runs on
EXPOSE 8080

# Run the React application
CMD ["npm", "run", "dev"]
