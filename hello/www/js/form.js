var formMap;

jQuery(document).ready( function($){
    initForm();
    
    // Submit events
    $('#form-button-ok').on('click', saveFormData);
    $('#form-button-cancel').on('click', cancelFormData);
    $('#form-button-delete').on('click', deleteFormData);
    
});

// This function must be able to create and modify any record
function initForm(){
    
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
    formMap._onResize();
}

function saveFormData() {
    // TODO: scrape obj from the form
    var obj = {
        import: $("#form-import").val(),
        currency: $("[name='form-currency']:checked").val(),
        description: $('#form-description').val(),
        category: $('#form-category').val(),
        time: 0,
        latitude: 0,
        longitude : 0
    };
    
    console.log(obj);
    
    // insert into db
    // TODO: this must be un UPSERT
    // TODO: time counter adn automatic save
    insertRecord(obj);
    
    history.back();
}

function cancelFormData() {
    //$.mobile.navigate('#home');
    history.back();
}

function deleteFormData() {
    //$.mobile.navigate('#home');
    history.back();
}