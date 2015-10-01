var recognition;
var parser;
var db;

var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

if ( !!window.cordova ) {
    console.log('we are on device');
    $.when(deviceReadyDeferred, jqmReadyDeferred).done( appInit );
} else {
    console.log('we are on desktop');
    // TODO: make HTML5 speech recog work
    var SpeechRecognition = webkitSpeechRecognition;
    $.when(jqmReadyDeferred).done( appInit );
}

$(document).ready( function () {
    console.log('jQuery is ready');
    jqmReadyDeferred.resolve();
});

document.addEventListener('deviceReady', onDeviceReady, false);
function onDeviceReady() {
    console.log('cordova is ready');
    deviceReadyDeferred.resolve();
}	

function appInit() {

    console.log('appInit fired');

    db = new Database();

    parser = new Parser();

    recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.onresult = function(event) {
        //console.log('speech event', event);
        if (event.results.length > 0) {
            var voiceInput = event.results[0][0].transcript;

            // parse command
            var obj = parser.parse(voiceInput);

            // give visual feedback
            //console.log(obj);
            $('#spoken').text(voiceInput);

            // update form
            precompileForm(obj);                        
        }
    };
    
    initReport();

    $('#speak-green').on('click', function(){
        initForm(1);
        $.mobile.navigate('#form');
        recognition.start();                            
    });

    $('#speak-red').on('click', function(){
        initForm(-1);
        $.mobile.navigate('#form');
        recognition.start();                            
    });
}