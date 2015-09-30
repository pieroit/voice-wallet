
describe('Database functions', function(){

    var db = new Database();
    
    it('prints error for wrong SQL', function(){
        
        spyOn(db, 'errorCallback');
        db.query('SELEC');
        //setTimeout( function(){
            expect(db.errorCallback).toHaveBeenCalled();
        //}, 0);
        
        db.query('CREATE TABLE IF NOT EXISTS settings (name TEXT, value TEXT)');
    });

    it('create and cleans db correclty', function(){
        db.createDB();
        // should be correctly instantiated
        
        db.populateDB();
        db.seeDB();
        // should contain dummy data
        
        db.cleanDB();
        db.seeDB();
        // should be empty
    });
    
    // Should be a form method... not DB
    it('validate record', function(){
        
    });
    
    it('insert record', function(){
        
    });
    
    it('upsert record', function(){
        
    });
    
    it('get records', function(){
            
    });

});