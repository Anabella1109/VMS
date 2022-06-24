// import postgresql from 'pg';
// import os from 'os';
const postgresql= require('pg');
const os= require('os');
const config=require('./config.json');

const { Pool } = postgresql;

module.exports= (callback = null) => {
  const pool = new Pool({
    // user: process.env.NODE_ENV === 'development' && (os.userInfo() || {}).username || '',
    user:"xvujbztpejdfwj",
    database: "ddf452db7gm1eb",
    password:"d18bd13ce9c7b7906612dd23f104e43c8fafd1d6b0828639ac4a054ef967a982",
    host:'ec2-23-23-151-191.compute-1.amazonaws.com',
    port:  5432,
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