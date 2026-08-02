const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'mr-electron-api',
      cwd: path.join(__dirname, 'api'),
      script: 'dist/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '300M',
      restart_delay: 3000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      time: true,
      merge_logs: true,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
