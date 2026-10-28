FROM node:22.23.4-bookworm-slim AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack pnpm install --frozen-lockfile

COPY . .

ARG VITE_TRACING_ENABLED=false
ENV VITE_TRACING_ENABLED=$VITE_TRACING_ENABLED
ARG VITE_TRACE_SAMPLE_RATE=0.1
ENV VITE_TRACE_SAMPLE_RATE=$VITE_TRACE_SAMPLE_RATE

ARG VITE_FARO_URL
ENV VITE_FARO_URL=$VITE_FARO_URL

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN corepack pnpm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
