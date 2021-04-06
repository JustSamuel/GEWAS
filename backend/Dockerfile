# We build our container using node:13-alpine
# We do this so that we can first use webpack and then create a new container using that.
FROM node:13-alpine as builder

WORKDIR /app
# Copy over our package and package-lock.
COPY package*.json ./

# Install our package
RUN npm ci

# Copy over everything from the src folder
COPY src src

# Copy the entry point to the container
COPY main.ts .

# Copy over the configs.
COPY webpack.config.ts .
COPY tsconfig.json .

# Build using webpack
RUN npm run build
RUN ls ./dist



# We now create the production container, using node:13-alpine.
FROM node:13-alpine
# Set env to production.
ENV NODE_ENV=production

# Go to the /app folder
WORKDIR /app

# User permissions.
RUN chown node:node .
USER node

# Copy over our package and packagelock.
COPY package*.json ./

# Install only the production packages.
RUN npm install --only=production

# Copy over our webpack compiled app from the builder container.
COPY --from=builder /app/dist .

# Expose the relevant port.
EXPOSE 3001

# Run the app.
CMD ["node", "app.js"]
