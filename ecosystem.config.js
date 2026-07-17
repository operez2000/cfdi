module.exports = {
  apps : [{
    name: 'Gusher-Online',
    exec_mode: 'cluster',
    instances: 1,
    script: './node_modules/nuxt/bin/nuxt.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'start',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
