// PM2 Ecosystem Configuration for Pollfind
// Uses start.sh script which loads .env before starting the analyzer

module.exports = {
  apps: [{
    name: 'pollfind',
    script: './start.sh',
    interpreter: '/bin/bash',
    cwd: './',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Kill timeout
    kill_timeout: 5000,
    // Wait for app to be ready
    wait_ready: false,
    // Listen timeout
    listen_timeout: 10000,
    // Restart delay
    restart_delay: 4000,
    // Min uptime before considered stable
    min_uptime: '10s',
    // Max restarts within min_uptime before giving up
    max_restarts: 10
  }]
};
