// by pieroit

// TODO: currency canonical form

var Parser = function(){
    this.canonicalCurrencies = {
        'EUR': ['€','euro','euros'],
        'USD': ['$','dollar','dollars','dollaro','dollari']
    };
    this.availableCurrencies = this.concatenateCurrencies();
    this.availableCategoryLemmas = ['category', 'categoria', 'categorìa',
                                    'catégorie', 'kategori', 'kategoria' ];
    this.sentence = '';
    this.model = {};
};

Parser.prototype = {
    
    parse: function( sentence ){
        
        this.model = {};
        this.sentence = sentence;
        this.parsePrice(); 
        this.parseCategory();
        this.parseDescription();
        
        return this.model;
    },
    
    parseCurrency: function(){
        
        // currencies
        var currencyRegex = this.buildOrRegex( this.availableCurrencies );
        var currency = this.matchFirstResult( this.sentence, currencyRegex );
        
        // Return canonical form
        this.model.currency = this.getCurrencyCanonical(currency);
        this.model.rawCurrency = currency;
        
        return this.model.currency;
    },
    
    parseAmount: function(){
        
        this.model.amount = null;
        
        //var amountRegex = VerEx().add( '[0-9]+' );
        //var amountFloatRegex = VerEx().add('[0-9]+').maybe(',').add('[0-9]+');
        //var amountLongRegex = VerEx().add('[0-9]+').maybe('.').add('[0-9]+');
        var amountRegex = VerEx().add('([0-9]+.)?').add('[0-9]+').add('(,[0-9]+)?');
        var amount = this.sentence.match( amountRegex );
        
        if( amount ){
            
            if( amount.length === 1 ){
                this.model.rawAmount = amount[0];
            } else {
                // there may be more numbers. Take the one with the nearest currency
                var currencyPosition = this.sentence.indexOf( this.model.rawCurrency );
                var nearestAmountDistance = 1000000;
                var nearestAmount;
                for(var a=0; a<amount.length; a++){
                    var amountIndex = this.sentence.indexOf( amount[a] );
                    var distance = Math.abs( currencyPosition - amountIndex );
                    if( distance < nearestAmountDistance ){
                        nearestAmountDistance = distance;
                        nearestAmount = amount[a];
                    }
                }
                
                this.model.rawAmount = nearestAmount;
            }
            
            // convert to number
            // taking away . from long numbers (1.000.000) and substituting , with . for real numbers
            this.model.amount = parseFloat( this.model.rawAmount.replace('.', '').replace(',','.') );
        }
        
        return this.model.amount;
    },
    
    parsePrice: function(){
        
        // currency
        this.parseCurrency();
        var currency = this.model.rawCurrency;

        // amount
        this.parseAmount();
        var amount = this.model.rawAmount;
        
        // allow the two in different order
        var currencyAmountRegex = VerEx().add(currency).maybe(' ').add(amount);
        var amountCurrencyRegex = VerEx().add(amount).maybe(' ').add(currency);
        
        var priceRegex = VerEx().then(currencyAmountRegex).or().then(amountCurrencyRegex);
        this.model.price = this.matchFirstResult( this.sentence, priceRegex );
        
        return this.model.price;
    },
    
    // TODO: category parsing should be semantic
    parseCategory: function(){
        
        // Start with null
        this.model.category = null;
        
        // currencies
        var categoryLemmaRegex = this.buildOrRegex( this.availableCategoryLemmas );
        var categoryLemma = this.sentence.match( categoryLemmaRegex );
        
        if(categoryLemma){
            
            this.model.categoryLemma = categoryLemma;

            var categoryRegex = VerEx().add(categoryLemma).add(' ').anything();
            var categoryAndLemma = this.matchFirstResult( this.sentence, categoryRegex );

            if( categoryAndLemma ) {
                this.model.category = categoryAndLemma.replace( categoryLemma, '' ).trim();
            }
        }
        
        return this.model.category;
    },
    
    parseDescription: function(){
        this.model.description = this.sentence
                .replace( this.model.price, '' )
                .replace( this.model.category, '' )
                .replace( this.model.categoryLemma, '' )
                .replace( '  ', ' ')
                .trim();
        
        return this.model.description;
    },
    
    matchFirstResult: function( string, regex ){
        var result = string.match( regex );
        if( result && result.length > 0 ){
            return result[0];
        }
        return null;
    },
    
    buildOrRegex: function(array) {
        var orRegex = VerEx();
        
        for(var c=0; c < array.length; c++){
            orRegex.then( array[c] );
            if(c < array.length - 1){    // avoid OR at the end of the regex
                orRegex.or();
            }
        }
        
        return orRegex;
    },
    
    concatenateCurrencies: function(){
        
        var currencies = [];
        
        for(k in this.canonicalCurrencies){
            for(curr in this.canonicalCurrencies[k] ){
                var newCurr = this.canonicalCurrencies[k][curr];
                currencies.push(newCurr);
            }
        }

        return currencies;
    },
    
    getCurrencyCanonical: function(currency){

        for(k in this.canonicalCurrencies){
            for(curr in this.canonicalCurrencies[k] ){
                
                var availableCurr = this.canonicalCurrencies[k][curr];
                if( currency === availableCurr ){
                    return k;
                }
            }
        }
        
        return null;
    }
    
};