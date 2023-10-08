# We build our container using node:13-alpine
# We do this so that we can first use webpack and then create a new container using that.
FROM node:20-alpine as builder

WORKDIR /usr/src/app
# Copy over our package and package-lock.
COPY package*.json ./

# Install our package
RUN npm i

# Copy over the configs.
COPY webpack.config.ts .
COPY tsconfig.json .

# Copy over the source files
COPY src /usr/src/app/src

# Copy the entry point to the container
COPY main.ts .


# Build using webpack
RUN npm run build


# We now create the production container, using node:13-alpine.
FROM node:20-alpine
# Set env to production.
ENV NODE_ENV=production

# Set WORKDIR to /usr/src/app
WORKDIR /usr/src/app

# Copy over our package and packagelock.
COPY package*.json ./

# Install only the production packages.
RUN npm install --only=production

# Copy over our webpack compiled app from the builder container.
COPY --from=builder /usr/src/app/dist /usr/src/app/

# User permissions.
RUN chown -R node:node .
USER node


# Expose the relevant port.
EXPOSE 9404

CMD ["node", "app.js"]
