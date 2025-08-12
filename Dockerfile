# Use an official lightweight Node.js image as a parent. Alpine is a small
# distribution which keeps the image size minimal. Specify a Node.js version
# explicitly to avoid breaking changes when the latest tag is updated.
FROM node:20-alpine

# Install build tools needed to compile native modules such as sqlite3. Node
# packages like sqlite3 rely on node-gyp, which requires Python, make and a
# compiler toolchain. On Alpine, these packages are available via apk.
RUN apk add --no-cache python3 make g++

# Create and set the working directory inside the container. All subsequent
# commands will be run in this directory. The `/app` folder is conventional
# for application code.
WORKDIR /app

# Copy package metadata separately to leverage Docker's caching. If package.json
# and package-lock.json do not change, the npm install layer will be reused on
# subsequent builds, speeding up deployment.
COPY package.json package-lock.json ./

# Install dependencies defined in package.json. The `--production` flag
# prevents devDependencies from being installed, reducing image size. If you
# need devDependencies (e.g., for compiling TypeScript), remove this flag.
RUN npm install --production

# Copy the rest of the application code into the working directory. This
# includes the server.js file, the website folder, and any other assets.
COPY . .

# Expose the port that the application listens on. Railway will map this port
# automatically. The server uses PORT env variable if provided, defaulting to
# 3000.
EXPOSE 3000

# Define the default command to run the application. When the container starts,
# Node.js will execute server.js. If you change the entry point of your app,
# update this line accordingly.
CMD ["node", "server.js"]