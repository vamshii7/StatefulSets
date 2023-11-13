const mysql = require('mysql');

// Connection configuration
const dbConfig = {
  host: 'mysql-db',
  user: 'your-database-user',
  password: 'your-database-password',
  database: 'your-database-name',
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Function to execute read queries
function performReadQuery(query, callback) {
  pool.query(query, (error, results) => {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
}

// Function to execute write queries
function performWriteQuery(query, callback) {
  // For write operations, direct them to the master pod (mysql-0)
  const connection = mysql.createConnection({
    ...dbConfig,
    host: 'mysql-0.mysql-db',
  });

  connection.query(query, (error, results) => {
    connection.end(); // Close the connection after the query
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
}

module.exports = { performReadQuery, performWriteQuery };
