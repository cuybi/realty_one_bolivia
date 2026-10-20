module.exports = {
  apps: [
    {
      name: 'whatsapp-crm-bot',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork', // Baileys DEBE correr en fork único para no duplicar sockets
      autorestart: true,
      watch: false,
      max_memory_restart: '320M', // Reinicio de seguridad antes de los 512MB de Serv00
      env: {
        NODE_ENV: 'production',
        TZ: 'America/La_Paz'
      }
    }
  ]
};
