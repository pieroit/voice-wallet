var db = window.openDatabase("VocalExpenses", "1.0", "VocalExpenses", 10000000);

// Init db
db.transaction(createDB, errorCB);
db.transaction(populateDB, errorCB);

var dumpRecords = [
    {
        time: moment('2014-12-30 10:30').unix(),
        import: -300,
        category: 'spesa',
        description: '...'
    },
    {
        time: moment('2015-01-01 10:30').unix(),
        import: -200,
        category: 'spesa',
        description: '...'
    },
    {
        time: moment('2015-01-01 18:30').unix(),
        import: -20,
        category: 'spesa',
        description: '...'
    },
    {
        time: moment('2015-01-05 10:30').unix(),
        import: -130,
        category: 'spesa',
        description: '...'
    },
    {
        time: moment('2015-01-07 10:30').unix(),
        import: -3,
        category: 'trasporti',
        description: '...'
    },
    {
        time: moment('2015-01-07 10:30').unix(),
        import: -25,
        category: 'trasporti',
        description: '...'
    },
    {
        time: moment('2015-01-23 10:30').unix(),
        import: -30,
        category: 'bollette',
        description: '...'
    },
    {
        time: moment('2015-01-23 10:30').unix(),
        import: 100,
        category: 'paghetta',
        description: 'posso comprare sipiderman!'
    },
    {
        time: moment('2015-02-24 10:30').unix(),
        import: 1500,
        category: 'stipendio',
        description: '...'
    }
];

for(var i in dumpRecords){
    insertRecord( dumpRecords[i] );
}

db.transaction(seeDB, errorCB);

// Drop all tables
function cleanDB(tx){
    tx.executeSql('DROP TABLE IF EXISTS transactions');
    tx.executeSql('DROP TABLE IF EXISTS settings');
}

// Create DB
function createDB(tx) {
    
    // Delete tables... TODO: not good for production
    cleanDB(tx);
    
    // Create tables
    tx.executeSql('CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, time INTEGER, import REAL, currency TEXT, category TEXT, description TEXT, latitude REAL, longitude REAL)'); 
    tx.executeSql('CREATE TABLE IF NOT EXISTS settings (name TEXT, value TEXT)'); 
}

// Populate DB
function populateDB(tx){
    
    // Demo data
    /*tx.executeSql('INSERT INTO transactions (id, time, import, currency, category, description, latitude, longitude) VALUES ("1243412", 1436868861, 23, "EUR", "spesa", "latte et biscotti", 43.2345, 98.242354)');
    tx.executeSql('INSERT INTO transactions (id, time, import, currency, category, description, latitude, longitude) VALUES ("223341", 1436868861, -23, "EUR", "paghetta", "nonna", 34.23424, 56.23535)');
    tx.executeSql('INSERT INTO transactions (id, time, import, currency, category, description, latitude, longitude) VALUES ("342414", 1436868863, 12.10, "USD", "trasporti", "benza GPL", 34.6456, 66.1123)');*/
    tx.executeSql('INSERT INTO settings (name, value) VALUES ("language", "it")');
    tx.executeSql('INSERT INTO settings (name, value) VALUES ("share_data", "yes")');
    
    // TODO: add this feature
    tx.executeSql('INSERT INTO settings (name, value) VALUES ("last_report_query", "stringifiedJSON")');
}

function seeDB(tx){
    tx.executeSql('SELECT * FROM transactions', [], querySuccess, errorCB);
    tx.executeSql('SELECT * FROM settings', [], querySuccess, errorCB);
}

function querySuccess(tx, results) {
    console.log('results:', results);
}

// Transaction error callback
function errorCB(err) {
    if (err.code == "0") {
        console.log("0 - UNKNOWN_ERR: The transaction failed for reasons unrelated to the database itself and not covered by any other error code.");
    }
    if (err.code == "1") {
        console.log("1 - DATABASE_ERR: The statement failed for database reasons not covered by any other error code.");
    }
    if (err.code == "2") {
        console.log("2 - VERSION_ERR: The operation failed because the actual database version was not what it should be. For example, a statement found that the actual database version no longer matched the expected version of the Database or DatabaseSync object, or the Database.changeVersion() or DatabaseSync.changeVersion() methods were passed a version that doesn't match the actual database version.");
    }
    if (err.code == "3") {
        console.log("3 - TOO_LARGE_ERR: The statement failed because the data returned from the database was too large. The SQL 'LIMIT' modifier might be useful to reduce the size of the result set.");
    }
    if (err.code == "4") {
        console.log("4 - QUOTA_ERR: The statement failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.");
    }
    if (err.code == "5") {
        console.log("5 - SYNTAX_ERR: The statement failed because of a syntax error, or the number of arguments did not match the number of ? placeholders in the statement, or the statement tried to use a statement that is not allowed, such as BEGIN, COMMIT, or ROLLBACK, or the statement tried to use a verb that could modify the database but the transaction was read-only.");
    }
    if (err.code == "6") {
        console.log("6 - CONSTRAINT_ERR: An INSERT, UPDATE, or REPLACE statement failed due to a constraint failure. For example, because a row was being inserted and the value given for the primary key column duplicated the value of an existing row.");
    }
    if (err.code == "7") {
        console.log("7 - TIMEOUT_ERR: A lock for the transaction could not be obtained in a reasonable time.");
    }
}

function validateRecord( record ) {
    if( !record.currency )
        record.currency = 'EUR';
    if( !record.description )
        record.description = ' ';
    if( !record.latitude )
        record.latitude = 0.0;
    if( !record.longitude )
        record.longitude = 0.0; 
    
    // TODO: make other checks on the other fields
    
    return record;
}

// Insert transaction into db.
function insertRecord( recordObj ) {
    
    // Sanitize
    recordObj = validateRecord( recordObj );
    
    db.transaction( function(tx) {
        //console.log('inserting', recordObj, 'into DB');
        var query = 'INSERT INTO transactions (id, time, import, currency, category, description, latitude, longitude) VALUES (';
        query += '"' + moment().valueOf() + '"';            // TODO: find a better id
        query += ', ' + moment().unix();                 // time TODO: this could be set manually in the form... please check
        query += ', ' + recordObj.import.toString();
        query += ', "' + recordObj.currency + '"';
        query += ', "' + recordObj.category + '"';      
        query += ', "' + recordObj.description + '"';
        query += ', ' + recordObj.latitude;
        query += ', ' + recordObj.longitude;
        query += ')';
        
        console.log(query);
        tx.executeSql(query, [], querySuccess, errorCB);
    }, errorCB);  
}

function getRecords( queryObject, callback ) {
    db.transaction( function(tx) {
        console.log('    getting data to populate report', queryObject);
        var query = 'SELECT * FROM transactions ORDER BY time DESC';
        tx.executeSql(query, [], callback, errorCB);
    });
}