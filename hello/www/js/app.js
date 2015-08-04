
    /*document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("navigator", navigator.geolocation);
        navigator.geolocation.getCurrentPosition(
            function(a){
                console.log(a);
            },
            function(e){
                console.log(e);
            }
        );
        jQuery(document).ready(function($){

            // prova jquery
            $('#deviceready').append('ciaooooooooo');

            // prova API con CORS
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "https://en.wikipedia.org/w/api.php?action=parse&section=0&prop=text&page=pizza&format=json",
                success: function(res){
                    console.log(res);
                    $('#deviceready').append(res);
                }
            });

            // prova annyang
            console.log('is annyang?');
            if( annyang ) {

                function logMessage(mex) {
                    console.log(mex);
                    $('#deviceready').append(mex);
                }

                annyang.debug(true);
                annyang.setLanguage('it-IT');

                var commands = {
                    '*comando': logMessage
                };

                annyang.addCommands(commands);

                annyang.start({autoRestart: true});
                console.log('annyang start issued');
            }

            var recognition = new SpeechRecognition();
            recognition.onresult = function(event) {
                $('#deviceready').append('WHaaat?');
                console.log(event);
            };

            $('#speak').click(function(){
                console.log('speak');
                recognition.start();
            });


        });
    }*/
