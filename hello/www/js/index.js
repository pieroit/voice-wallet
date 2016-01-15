var recognition;
var parser;
var db;
var settings = {};

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
    // TODO: improve this behaviour
    db.getSettings( function(tx, res){
        
        for( var i=0; i<res.rows.length; i++ ){
            var item = res.rows.item(i);
            var key = item.name;
            var value = item.value;
            settings[ key ] = value;
        }
        settings['last_report_query'] = JSON.parse( unescape( settings['last_report_query'] ) );
        
        // Set up language
        /*navigator.globalization.getLocaleName(
            function (locale) {alert('locale: ' + locale.value + '\n');},
            function () {alert('Error getting locale\n');}
        );*/
        moment.locale('en');

        parser = new Parser();

        recognition = new SpeechRecognition();
        recognition.lang = 'it-IT'; // TODO: set the correct language
        recognition.onresult = function(event) {
            //console.log('speech event', event);
            if (event.results.length > 0) {
                var voiceInput = event.results[0][0].transcript;

                // parse command
                var obj = parser.parse(voiceInput);

                // update form
                precompileForm(obj);
                
                // give visual feedback
                //console.log(obj);
                $('#form-status').text(' ' + voiceInput);
            }
        };

        initReport();
    });


    // events for the home buttons
    $('#speak-green, #speak-red').on('click', function(e){
        if( $(e.target).attr('id') == 'speak-green' ) {
            initForm(1);
        } else {
            initForm(-1);
        }
        
        $.mobile.navigate('#form');
        $('#form-status').text(' recording ...');
        recognition.start();                            
    });
}