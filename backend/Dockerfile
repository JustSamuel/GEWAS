# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies using Yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy configs and source
COPY webpack.config.ts tsconfig.json ./
COPY src ./src
COPY main.ts ./

# Build the app
RUN yarn build


# --- Production Stage ---
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built app
COPY --from=builder /usr/src/app/dist ./

# Set permissions and run as non-root user
RUN chown -R node:node .
USER node

EXPOSE 9404

CMD ["node", "app.js"]
