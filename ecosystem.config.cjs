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
  ],
}
