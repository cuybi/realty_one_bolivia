const path = require('path');
const isWindows = process.platform === 'win32';

module.exports = {
  apps: [{
    name: 'realty-one-bot',
    script: 'server.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TZ: 'America/La_Paz'
    },
    error_file: isWindows ? path.join(__dirname, 'logs', 'error.log') : '/var/log/realty-one-bot/error.log',
    out_file: isWindows ? path.join(__dirname, 'logs', 'out.log') : '/var/log/realty-one-bot/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    restart_delay: 5000,
    max_restarts: 50,
    min_uptime: '10s'
  }]
};
