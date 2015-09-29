
describe('Parses simple expense sentences', function(){

    var basicSentences = [
        'comprato il latte a 10€',
        'comprato il latte a €10',
        'comprato il latte a 10 €',
        'comprato il latte a € 10',
        '€ 10 spesi per il latte',
        '€10 spesi per il latte',
        '10 € spesi per il latte',
        '€ 10 spesi per il latte',
        'comprato 10€ di latte',
        'comprato €10 di latte',
        'comprato 10 € di latte',
        'comprato 10 € di latte'
    ];

    var pars = new Parser();

    it('extracts the currency', function(){
            
        basicSentences.forEach( function( sentence ){
            var obj = pars.parse( sentence );
            expect( obj.currency ).toEqual('€');
        });
    });
    
    it('extracts the amount', function(){
            
        basicSentences.forEach( function( sentence ){
            var obj = pars.parse( sentence );
            expect( obj.amount ).toEqual('10');
        });
    });
    
    it('extracts the price', function(){
            
        basicSentences.forEach( function( sentence ){
            var obj = pars.parse( sentence );
            expect( obj.price ).toContain('€');
            expect( obj.price ).toContain('10');
        });
        
        // Many numbers in a sentence
        var obj = pars.parse( 'il 2 gennaio 2014 ho speso 10 € per il 4 cartoni di latte' );
        expect( obj.price ).toBe('10 €');
        
        //TODO: decimal part of the price (could be made of words, e.g. 'speso 10€ e mezzo'). 
    });
    
    it('extracts the category', function(){

        var obj = pars.parse( 'speso 10€ per il latte' );
        expect( obj.category ).toBeNull();
        
        var obj = pars.parse( 'speso 10€ per il latte categoriaspesa' );
        expect( obj.category ).toBeNull();
        
        var obj = pars.parse( 'speso 10€ per il latte categoria spesa' );
        expect( obj.category ).toBe('spesa');
        
        var obj = pars.parse( 'speso 10€ per il latte categoria spesa al discount' );
        expect( obj.category ).toBe('spesa al discount');    
    });
    
    it('extracts the description', function(){
        
        var obj = pars.parse( 'speso 10€ per il latte categoria spesa' );
        expect( obj.description ).toBe('speso per il latte');    
    });
});