// import postgresql from 'pg';
// import os from 'os';
const postgresql= require('pg');
const os= require('os');
const config=require('../config.json');

const { Pool } = postgresql;

module.exports= (callback = null) => {
  const pool = new Pool({
    // user: process.env.NODE_ENV === 'development' && (os.userInfo() || {}).username || '',
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE ,
    password:process.env.DATABASE_PASSWORD,
    host:process.env.DATABASE_HOST,
    port:  5432,
    ssl: {
      rejectUnauthorized: false
    }
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