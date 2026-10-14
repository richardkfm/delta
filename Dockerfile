# Stage 1: install dependencies, run the tests and build the static site.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Link target of the embeddable widget, read by Vite at build time.
ARG VITE_DELTA_APP_URL=

COPY . .
RUN npm test && npm run build

# Stage 2: serve the static build with nginx.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
