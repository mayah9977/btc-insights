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
  ],
}
