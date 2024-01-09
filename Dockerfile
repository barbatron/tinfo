ARG BUILD_IMAGE=node:20-slim
ARG PORT=8080

# Prep pnpm
# Install pnpm
FROM $BUILD_IMAGE AS env
COPY . /app
WORKDIR /app

RUN npm install -g pnpm

# todo: layer
# RUN pnpm i
RUN npm i

#" FROM deps AS production
ENV NODE_ENV="production"
EXPOSE 8000
CMD ["pnpm", "dev"] 
