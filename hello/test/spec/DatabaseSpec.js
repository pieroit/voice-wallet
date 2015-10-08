
describe('Database functions', function(){

    var db = new Database();
    
    beforeEach(function(){
        db.createDB();
    });
    
    afterEach(function(){
        db.cleanDB();
    });
    
    it('prints error for wrong SQL', function(done){
        
        spyOn(db, 'errorCallback');
        db.query('SELEC');
        setTimeout( function(){
            expect(db.errorCallback).toHaveBeenCalled();
            done();
        }, 500);
    });

    it('populates db correctly', function(done){

        db.populateDB();
        // should contain dummy data
        db.query('SELECT COUNT(*) FROM transactions', function(tx, res){
            expect(res.rows[0]['COUNT(*)']).toEqual(9);
            done();
        });
    });
    
    it('cleans db correctly', function(done){
        
        db.populateDB();
        db.cleanDB();
        db.createDB();
        // should be empty
        db.query('SELECT COUNT(*) FROM transactions', function(tx, res){
            expect(res.rows[0]['COUNT(*)']).toEqual(0);
            done();
        });

    });
    
    // Should be a form method... not DB
    it('validates record', function(){
        
    });
    
    it('inserts record', function(done){
        db.upsertRecord({
            time: 1111111111,
            amount: -300,
            category: 'spesa',
            description: '...'
        });
        
        db.query('SELECT * FROM transactions', function(tx, res){
            expect(res.rows.length).toEqual(1);
            
            var obj = res.rows[0];
            expect(obj.time).toEqual(1111111111);
            expect(obj.amount).toEqual(-300);
            expect(obj.category).toEqual('spesa');
            expect(obj.description).toEqual('...');
            done();
        });
    });
    
    it('upserts record', function(done){
        var obj = {
            id: 123456789,
            time: 1111111111,
            amount: -300,
            category: 'spesa',
            description: '...'
        };
        
        // insert object
        db.upsertRecord(obj);
        
        // change it and update it
        obj.amount = 1000000;
        obj.category = 'trasporto';
        db.upsertRecord(obj);
        
        db.query('SELECT * FROM transactions', function(tx, res){
            
            var obj = res.rows[0];
            
            // there is still only one record
            expect(res.rows.length).toEqual(1);
            
            // with the same id
            expect(obj.id).toEqual(123456789);
            
            // but changed values
            expect(obj.amount).toEqual(1000000);
            expect(obj.category).toEqual('trasporto');
            done();
        });
    });
    
    it('deletes records', function(done){
        var obj = {
            id: 123456789,
            time: 1111111111,
            amount: -300,
            category: 'spesa',
            description: '...'
        };
        
        // insert object
        db.upsertRecord(obj);
        
        // verify insertion
        db.getRecords(null, function(tx, res){
            console.log(res);
            expect(res.rows.length).toEqual(1);
            done();
        });
        
        // now delete it
        db.deleteRecord(obj.id);
        
        // verify deletion
        db.getRecords(null, function(tx, res){
            console.log(res);
            expect(res.rows.length).toEqual(0);
            done();
        });
    });
    
    it('gets records', function(){
        // TODO, simpoe queries   
    });
    
    it('gets settings', function(done){
        
        // should obtain default values
        db.getSettings(function(tx, res){
            
            var settings = res.rows;
            
            expect(settings.length).toEqual(2);
            expect(settings[0].name).toEqual('language');
            expect(settings[0].value).toEqual('it-IT');
            expect(settings[1].name).toEqual('last_report_query');
            expect( unescape( settings[1].value ) ).toEqual('{}');
            
            done();
        });
    });

    it('update setting', function(done){
        
        var settings = [
            {
                name: 'language',
                value: 'en-US'
            },
            {
                name: 'last_report_query',
                value: {yabbadooooo: 12}
            }
        ];
        
        // update
        db.updateSettings(settings);
        
        // verify changes
        db.getSettings(function(tx, res){
            
            var settings = res.rows;
            
            expect(settings.length).toEqual(2);
            expect(settings[0].name).toEqual('language');
            expect(settings[0].value).toEqual('en-US');
            expect(settings[1].name).toEqual('last_report_query');
            expect( unescape(settings[1].value) ).toEqual('{"yabbadooooo":12}');
            
            done();
            
        });
        
    });

});