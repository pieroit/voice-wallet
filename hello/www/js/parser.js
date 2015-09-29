
    var optionalParam = /\s*\((.*?)\)\s*/g;
    var optionalRegex = /(\(\?:[^)]+\))\?/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#]/g;
    var commandToRegExp = function(command) {
        command = command.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
            return optional ? match : '([^\\s]+)';
            })
            .replace(splatParam, '(.*?)')
            .replace(optionalRegex, '\\s*$1?\\s*');
        return new RegExp('^' + command + '$', 'i');
    };
    
    var parseSentence = function(s){
        var obj = {};
        var commandsList = [];
        
        s = s.trim();
        
        //convert command to regex
        var phrases = [
            '€*import *content (' + i0n('categoria') + ' *cat)',
            i0n('si'),
            i0n('no')];
        for(var i=0; i<phrases.length; i++){
            var command = commandToRegExp(phrases[i]);
            commandsList.push({ command: command });
            console.log('compiled command', command);
        }
        
        console.log('----');
        
        for (var j=0; j<commandsList.length; j++) {
            console.log('sentence', s, 'against', commandsList[j].command);
            var result = commandsList[j].command.exec(s);
            
            console.log(result);
            if(result){
                result = result.splice(1);
                if(result.length >= 3){
                    obj.import = +result[0];
                    obj.currency = 'EUR';
                    obj.description = result[1].trim();
                    obj.category = result[2];
                }
            }
        }
        
        return obj;
    };
    
    
    
// by pieroit

var Parser = function(){
    this.availableCurrencies = ['€','euro','euros', '$','dollar','dollars']; // TODO: lista in tutte le lingue e con i valori canonical
    this.availableCategoryLemmas = ['category', 'categoria'];   // TODO: tutte le lingue
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
        this.model.currency = this.matchFirstResult( this.sentence, currencyRegex );
        return this.model.currency;
    },
    
    parseAmount: function(){
        
        this.model.amount = null;
        
        var amountRegex = VerEx().add( '[0-9]+' );
        var amount = this.sentence.match( amountRegex );
        
        if( amount ){
            if( amount.length === 1 ){
                this.model.amount = amount[0];
            } else {
                // there may be more numbers. Take the one with the nearest currency
                var currencyPosition = this.sentence.indexOf( this.model.currency );
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
                
                this.model.amount = nearestAmount;
            }
        }
        
        
        return this.model.amount;
    },
    
    parsePrice: function(){
        
        // currency
        var currency = this.parseCurrency();

        // amount
        var amount = this.parseAmount();
        
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
    }
    
};