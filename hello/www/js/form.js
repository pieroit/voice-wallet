var formMap;

jQuery(document).ready( function($){
    
    // Submit events
    $('#form-button-ok').on('click', saveFormData);
    $('#form-button-cancel').on('click', cancelFormData);
    $('#form-button-delete').on('click', deleteFormData);
    
});

// This function must be able to create and modify any record
function initForm(recordPolarity){
    
    // Set record polarity in the form
    $('#form-amount-polarity').val( recordPolarity );
    
    // init default values
    // TODO: date is american style... should be european
    $('#form-date').val( moment().format('YYYY-MM-DD') );
    $('#form-time').val( moment().format('HH:mm') );
    
    // TODO: get current location or latest location
    if(!formMap) {
        formMap = L.map('form-map').setView([51, 0], 14);

        L.tileLayer( 'http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
                maxZoom: 18
            }
        ).addTo(formMap);
    }
    
    // force tile redraw, otherwise they remain gray
    //formMap._onResize();
}

function precompileForm(obj) {
    
    if( !obj.time ){
        obj.time = moment().unix();
    }
    var objDate = moment.unix( obj.time ).format('YYYY-MM-DD');
    var objTime = moment.unix( obj.time ).format('HH:mm');

    // update form
    if( obj !== {} ) {
        $("#form-amount").val( obj.amount );
        $("[name='form-currency']:checked").val();  // not easy :|
        $('#form-description').val( obj.description );
        $('#form-category').val( obj.category );
        $('#form-date').val( objDate );
        $('#form-time').val( objTime );
        //latitude: 0;  // TODO
        //longitude : 0;    // TODO
    }
}

function saveFormData() {
    
    var formAmount = parseFloat( $('#form-amount').val() );
    formAmount *= parseFloat( $('#form-amount-polarity').val() );
    
    var formDate = $('#form-date').val();
    var formTime = $('#form-time').val();
    var formDateTime = moment(formDate + 'T' + formTime);
    console.log(formDate, formTime, formDateTime);
    
    var obj = {
        amount: formAmount,
        currency: $("[name='form-currency']:checked").val(),
        description: $('#form-description').val(),
        category: $('#form-category').val(),
        time: formDateTime.unix(),
        latitude: 0, // TODO
        longitude : 0 // TODO
    };
    
    console.log(obj);
    
    // insert into db
    // TODO: this must be un UPSERT
    // TODO: time counter adn automatic save
    db.upsertRecord(obj, function(){
        history.back();
    });
}

function cancelFormData() {
    
    // TODO: clean form from data
    
    //$.mobile.navigate('#home');
    history.back();
}

function deleteFormData() {
    //$.mobile.navigate('#home');
    // TODO: should delete record
    
    cancelFormData();
}