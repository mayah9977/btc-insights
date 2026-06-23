module.exports = {
  apps: [
    {
      name: 'price-poller',
      script: 'scripts/price-poller.ts',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
    },
    {
      name: 'next-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
    },
    {
      name: 'telegram-bot',
      script: 'lib/telegram/telegramBot.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'binance-stream-worker',
      cwd: '/var/www/app',
      script: './node_modules/.bin/tsx',
      args: 'worker/binance-stream-worker.ts',
      watch: false,
      autorestart: true,
      max_memory_restart: '300M',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        BINANCE_SYMBOL: 'BTCUSDT',
        BINANCE_WS_MODE: 'multi',
        BINANCE_WS_DEBUG: 'false',
      },
    },
  ],
}
