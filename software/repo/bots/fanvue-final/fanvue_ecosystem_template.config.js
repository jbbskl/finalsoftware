module.exports = {
  apps: [
    {
      name: 'fleur-posting',
      script: './fleur_posting/main.py',
      interpreter: 'python3',
      cwd: '/home/deploy/fanvue_final',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 4,6,8,10,12,14,16,18,20,22 * * *', // Restart at posting times
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      log_file: '/var/log/fanvue/fleur_posting.log',
      out_file: '/var/log/fanvue/fleur_posting_out.log',
      error_file: '/var/log/fanvue/fleur_posting_error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'fleur-massdm',
      script: './fleur_massdm/main.py',
      interpreter: 'python3',
      cwd: '/home/deploy/fanvue_final',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 2,8,13,16,18,21 * * *', // Restart at mass DM times
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      log_file: '/var/log/fanvue/fleur_massdm.log',
      out_file: '/var/log/fanvue/fleur_massdm_out.log',
      error_file: '/var/log/fanvue/fleur_massdm_error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'floortje-posting',
      script: './floortje_posting/main.py',
      interpreter: 'python3',
      cwd: '/home/deploy/fanvue_final',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '20 4,6,8,10,12,14,16,18,20,22 * * *', // Restart at posting times (20 min after Fleur)
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      log_file: '/var/log/fanvue/floortje_posting.log',
      out_file: '/var/log/fanvue/floortje_posting_out.log',
      error_file: '/var/log/fanvue/floortje_posting_error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'floortje-massdm',
      script: './floortje_massdm/main.py',
      interpreter: 'python3',
      cwd: '/home/deploy/fanvue_final',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 2,8,13,16,18,21 * * *', // Restart at mass DM times
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      log_file: '/var/log/fanvue/floortje_massdm.log',
      out_file: '/var/log/fanvue/floortje_massdm_out.log',
      error_file: '/var/log/fanvue/floortje_massdm_error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};