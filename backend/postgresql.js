import postgresql from 'pg';
import os from 'os';

const { Pool } = postgresql;

export default (callback = null) => {
  const pool = new Pool({
    user: process.env.NODE_ENV === 'development' && (os.userInfo() || {}).username || '',
    database: 'app',
    password: 'bellamava',
    host: '127.0.0.1',
    port: 5432,
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