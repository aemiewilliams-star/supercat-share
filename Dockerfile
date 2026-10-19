# 1) Node 단계: index 갤러리를 빌드 시점에 항상 새로 생성
FROM node:20-alpine AS build
WORKDIR /app
COPY scripts ./scripts
COPY public ./public
RUN node scripts/build-index.mjs

# 2) Caddy 단계: 정적 파일 서빙 (프로세스 가벼움 → auto-stop과 궁합 좋음)
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/public /srv
