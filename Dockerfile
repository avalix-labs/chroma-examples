# Playwright + MetaMask extension e2e for chroma-examples
FROM mcr.microsoft.com/playwright:v1.61.1-noble

ENV CI=true
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

WORKDIR /app

# Enable corepack / pin pnpm to match CI.
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Download MetaMask extension into the image.
RUN pnpm run test:prepare

CMD ["sh", "-c", "xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' -- pnpm exec playwright test --project=chromium-setup --reporter=html"]
