
var Database = function(){
    
    // Ope db
    this.db = window.openDatabase("VocalExpenses", "1.0", "VocalExpenses", 10000000);
    
    // Create tables if they don't exist yet
    this.createDB();
}

Database.prototype = {
    
    // Execute SQL
    query: function(queryString, callback){
        
        // Keep a reference to the current object
        var dbObj = this;
        
        this.db.transaction( function(tx) {
        
            console.log(queryString);
            tx.executeSql(queryString, [], callback, dbObj.errorCallback);
        });
        
    },
    
    // Transaction error callback
    errorCallback: function(tx, err) {
        if (err.code == "0") {
            console.error("0 - UNKNOWN_ERR: The transaction failed for reasons unrelated to the database itself and not covered by any other error code.");
        }
        if (err.code == "1") {
            console.error("1 - DATABASE_ERR: The statement failed for database reasons not covered by any other error code.");
        }
        if (err.code == "2") {
            console.error("2 - VERSION_ERR: The operation failed because the actual database version was not what it should be. For example, a statement found that the actual database version no longer matched the expected version of the Database or DatabaseSync object, or the Database.changeVersion() or DatabaseSync.changeVersion() methods were passed a version that doesn't match the actual database version.");
        }
        if (err.code == "3") {
            console.error("3 - TOO_LARGE_ERR: The statement failed because the data returned from the database was too large. The SQL 'LIMIT' modifier might be useful to reduce the size of the result set.");
        }
        if (err.code == "4") {
            console.error("4 - QUOTA_ERR: The statement failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.");
        }
        if (err.code == "5") {
            console.error("5 - SYNTAX_ERR: The statement failed because of a syntax error, or the number of arguments did not match the number of ? placeholders in the statement, or the statement tried to use a statement that is not allowed, such as BEGIN, COMMIT, or ROLLBACK, or the statement tried to use a verb that could modify the database but the transaction was read-only.");
        }
        if (err.code == "6") {
            console.error("6 - CONSTRAINT_ERR: An INSERT, UPDATE, or REPLACE statement failed due to a constraint failure. For example, because a row was being inserted and the value given for the primary key column duplicated the value of an existing row.");
        }
        if (err.code == "7") {
            console.error("7 - TIMEOUT_ERR: A lock for the transaction could not be obtained in a reasonable time.");
        }
    },
    
    // Upsert record
    // TODO: there is only insert right now
    upsertRecord: function(recordObj, callback){
        
        // Sanitize
        recordObj = validateRecord( recordObj );
        
        var query = 'INSERT INTO transactions (id, time, amount, currency, category, description, latitude, longitude) VALUES (';
        query += recordObj.id;
        query += ', ' + recordObj.time;                 // time TODO: this could be set manually in the form... please check
        query += ', ' + recordObj.amount.toString();
        query += ', "' + recordObj.currency + '"';
        query += ', "' + recordObj.category + '"';      
        query += ', "' + recordObj.description + '"';
        query += ', ' + recordObj.latitude;
        query += ', ' + recordObj.longitude;
        query += ')';

        this.query( query, callback );
    },
    
    getRecords: function(queryObject, callback){
        
        var query = 'SELECT * FROM transactions WHERE';
        
        // get expenses or incomes or both?
        if( queryObject.valence === 'expense' ) {
            query += ' amount < 0 AND';
        } else if(queryObject.valence === 'income' ) {
            query += ' amount > 0 AND';
        }
        query += ' time > ' + queryObject.start;
        query += ' AND time < ' + queryObject.end;
        
        query += ' ORDER BY time DESC';
        
        this.query(query, callback);
    },
    
    createDB: function(){
            
        // Delete tables...
        //cleanDB(tx);

        // Create tables
        this.query('CREATE TABLE IF NOT EXISTS transactions (id INT PRIMARY KEY, time INTEGER, amount REAL, currency TEXT, category TEXT, description TEXT, latitude REAL, longitude REAL)'); 
        this.query('CREATE TABLE IF NOT EXISTS settings (name TEXT, value TEXT)');
    },
    
    // Drop all tables
    cleanDB: function(){
        this.query('DROP TABLE IF EXISTS transactions');
        this.query('DROP TABLE IF EXISTS settings');
    },

    seeDB: function(){
        
        var consoleLog = function(tx, res){
            console.log(res);
        }
        
        this.query('SELECT * FROM transactions', consoleLog);
        this.query('SELECT * FROM settings', consoleLog);
    },
    
    populateDB: function(){
        
        var dumpRecords = [
            {
                time: moment('2014-12-30 10:30').unix(),
                amount: -300,
                category: 'spesa',
                description: '...'
            },
            {
                time: moment('2015-01-01 10:30').unix(),
                amount: -200,
                category: 'spesa',
                description: '...'
            },
            {
                time: moment('2015-01-01 18:30').unix(),
                amount: -20,
                category: 'spesa',
                description: '...'
            },
            {
                time: moment('2015-01-05 6:30').unix(),
                amount: -130,
                category: 'spesa',
                description: '...'
            },
            {
                time: moment('2015-01-07 10:30').unix(),
                amount: -3,
                category: 'trasporti',
                description: '...'
            },
            {
                time: moment('2015-01-07 10:30').unix(),
                amount: -25,
                category: 'trasporti',
                description: '...'
            },
            {
                time: moment('2015-01-23 10:30').unix(),
                amount: -30,
                category: 'bollette',
                description: '...'
            },
            {
                time: moment('2015-01-23 12:30').unix(),
                amount: 100,
                category: 'paghetta',
                description: 'posso comprare sipiderman!'
            },
            {
                time: moment('2015-02-24 10:30').unix(),
                amount: 1500,
                category: 'stipendio',
                description: '...'
            }
        ];

        for(var i in dumpRecords){
            this.upsertRecord( dumpRecords[i] );
        }
        
        this.query('INSERT INTO settings (name, value) VALUES ("language", "it")');
        this.query('INSERT INTO settings (name, value) VALUES ("share_data", "yes")');

        // TODO: add this feature
        this.query('INSERT INTO settings (name, value) VALUES ("last_report_query", "stringifiedJSON")');
    },
    
};


function validateRecord( record ) {
    if( !record) {
        record = {};
    }
    if( ! ('id' in record) )
        record.id = parseInt( Math.random()*1000000000, 10 );   // enough to be non-repeated?
    if( ! ('time' in record) )
        record.time = moment().unix();
    if( ! ('currency' in record) )
        record.currency = 'EUR';
    if( ! ('description' in record) )
        record.description = ' ';
    if( ! ('amount' in record) )
        record.amount = 0.0;
    if( ! ('latitude' in record) )
        record.latitude = 0.0;
    if( ! ('longitude' in record) )
        record.longitude = 0.0; 
        console.log(record);
    return record;
}