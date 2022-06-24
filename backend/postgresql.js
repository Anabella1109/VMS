// import postgresql from 'pg';
// import os from 'os';
const postgresql= require('pg');
const os= require('os');
const config=require('./config.json');

const { Pool } = postgresql;

module.exports= (callback = null) => {
  const pool = new Pool({
    // user: process.env.NODE_ENV === 'development' && (os.userInfo() || {}).username || '',
    user:config.postgres.user,
    database: config.postgres.database,
    password: config.postgres.password,
    host:process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
  });

  const connection = {
    pool,
    query: (...args) => {
      return pool.connect().then((client) => {
        return client.query(...args).then((res) => {
          client.release();
          return res.rows;
        });
      });
    },
  };

  process.postgresql = connection;

  if (callback) {
    callback(connection);
  }

  return connection;
};