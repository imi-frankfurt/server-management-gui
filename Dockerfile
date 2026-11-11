# Build on the runner's native platform: the .output bundle is pure JS, and the
# Vite 8/Rolldown native binary crashes under QEMU arm64 emulation (SIGILL).
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci

COPY . .
# Version shown in the UI, passed in by CI from the git tag (.git is not part of the build context)
ARG APP_VERSION=dev
ENV NUXT_PUBLIC_APP_VERSION=$APP_VERSION
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache ca-certificates

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ARG APP_VERSION=dev
ENV NUXT_PUBLIC_APP_VERSION=$APP_VERSION

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
