FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install
RUN npm rebuild sqlite3 --build-from-source

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:init && npm run start"]
