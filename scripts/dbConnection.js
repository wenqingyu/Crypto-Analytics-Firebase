var config = require('config')
var dbConfig = config.get('DBConfig')
var mysql = require('mysql2/promise')

console.log(dbConfig)
var conn = mysql.createPool(dbConfig)

module.exports = conn

// module.exports = pool.getConnection((err, connection) => {
//   // Use the connection
//   connection.query('SELECT something FROM sometable', function (error, results, fields) {
//     // And done with the connection.
//     connection.release()
//     // Handle error after the release.
//     if (error) throw error
//     // Don't use the connection here, it has been returned to the pool.
//   })
// })
