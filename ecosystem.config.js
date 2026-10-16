module.exports = {
  apps: [{
    name: 'realty-one-bot',
    script: 'server.js',
    cwd: '/opt/realty-one-bot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TZ: 'America/La_Paz'
    },
    error_file: '/var/log/realty-one-bot/error.log',
    out_file: '/var/log/realty-one-bot/out.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 50,
    min_uptime: '10s'
  }]
};
