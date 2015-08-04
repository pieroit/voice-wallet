
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
    
    var i0n = function(word){
       //TODO: insert translation here
       return word;
    };
    
    var parseSentence = function(s){
        var obj = {};
        var commandsList = [];
        
        s = s.trim();
        
        //convert command to regex
        var phrases = [
            '€*amount *content (' + i0n('categoria') + ' *cat)',
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
                    obj.amount = +result[0];
                    obj.currency = 'EUR';
                    obj.description = result[1].trim();
                    obj.category = result[2];
                }
            }
        }
        
        return obj;
    };