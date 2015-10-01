// TODO: this file must become a class
var svg;
var map;

function initReport(){
    
    console.log('init report');

    svg = d3.select('svg');
    
    $('#dashboard-controls').on('change', updateReport );
    $('#time-span-buttons').on('click', updateReport );
    
    // retrieve last query from DB and configure the panel
    setLatestReportQueryToControlPanel();
    
    updateReport();
}

function setLatestReportQueryToControlPanel() {
    
    // TODO: there should be a db setting for this
    // TODO: check that this is executed at report init
    
    // if not present in db, return default (or just put default in the DB)
    $('#time-span-button-start').data('time-span-start', moment().startOf('day').unix());
    $('#time-span-button-end').data('time-span-end', moment().endOf('day').unix());
    return {
        'type': 'pie',
        'start': moment().startOf('day').unix(),
        'end': moment().startOf('day').unix(),
        'valence': 'expense'
    };  
}

// extract query from the panel and save it into db before return it
function getReportQueryFromControlPanel() {
    
    var reportQuery = {
        'type': $("[name='radio-type']:checked").val(),
        'start': $('#time-span-button-start').data('time-span-start'),
        'end': $('#time-span-button-end').data('time-span-end'),
        'valence': $("[name='radio-valence']:checked").val()
    };
    
    return reportQuery;
}

// update report at each control panel event
function cleanReport() {

    // delete actual report contents and put on a loading gif
    $('#map-div').hide();
    $('#report-div').empty().hide();
    svg.selectAll('*').remove();
    svg.style('display', 'none');
    // TODO: loading gif, a nice one
}

function updateTimeSpan(event) {
   
    if(event && 'target' in event) {
        var verbalTimeSpan = $("[name='radio-span']:checked").data('verbal-span');
        var actualStart = parseInt( $('#time-span-button-start').data('time-span-start') , 10);
        
        // Left arrow was clicked
        if( $(event.target).attr('id') === 'time-span-button-start') {

            var newStart = moment.unix(actualStart).subtract(1, verbalTimeSpan).startOf(verbalTimeSpan).unix();
            $('#time-span-button-start').data('time-span-start', newStart);

            var newEnd = moment.unix(newStart).endOf(verbalTimeSpan).unix();
            $('#time-span-button-end').data('time-span-end', newEnd);
        }
        
        // Right arrow was clicked
        if( $(event.target).attr('id') === 'time-span-button-end') {

            var newStart = moment.unix(actualStart).add(1, verbalTimeSpan).startOf(verbalTimeSpan).unix();
            $('#time-span-button-start').data('time-span-start', newStart);

            var newEnd = moment.unix(newStart).endOf(verbalTimeSpan).unix();
            $('#time-span-button-end').data('time-span-end', newEnd);
        }
        
        // Time span checkbox was clicked
        if( $(event.target).parents('#span-control').length > 0 ) {
            
            // timespan end is now!
            var newEnd = moment().unix();
            
            // round to the end of day/week/month/year
            newEnd = moment.unix(newEnd).endOf(verbalTimeSpan).unix();
            
            $('#time-span-button-end').data('time-span-end', newEnd);

            var newStart = moment.unix(newEnd).startOf(verbalTimeSpan).unix();
            $('#time-span-button-start').data('time-span-start', newStart);
        }
    }
}

// each event in the control panel should fire a redraw
function updateReport(event) {
    
    cleanReport();
    
    // If the arrows where clicked, than update the arrows' timestamp
    updateTimeSpan(event);
    
    // extract report query from the DOM
    var reportQ = getReportQueryFromControlPanel();
    
    // write time span in human readable way
    var titleFrom = moment.unix(reportQ.start).format('YY MM DD HH:mm');
    var titleTo = moment.unix(reportQ.end).format('YY MM DD HH:mm');
    var verbalTimeSpanFormat = $("[name='radio-span']:checked").data('verbal-format');
    var humanReadableTimespan = moment.unix(reportQ.end).format(verbalTimeSpanFormat);
    $('#report-title').html( titleFrom + '</br>' + humanReadableTimespan + '</br>' + titleTo );

    // query data and update report
    getDataAndPopulateReport(reportQ);
}

// Based on the reportQuery, retrieve data
function getDataAndPopulateReport(reportQuery){
    
    db.getRecords( reportQuery, function(tx, results){
        console.log('GET RECS', results);
        var data = [];

        for(var i=0; i<results.rows.length; i++){
            data.push( results.rows.item(i) );
        }
        
        // update report with queried data
        updateSpecificReport(reportQuery.type, data);
    } );

}

function updateSpecificReport(type, data) {
    if( type === 'pie' ) {
        updateReportPie(data);
    } else if( type === 'line' ) {
        updateReportLine(data);
    } else if( type === 'list' ) {
        updateReportList(data);
    } else if( type === 'map' ) {
        updateReportMap(data);
    }
}

function updateReportList(data) {
    
    // TODO: edit and delete list items
    
    $('#report-div').show();
    
    d3.select('#report-div')
        .selectAll('tr')
        .data(data)
        .enter()
        .insert('tr', 'svg')   // append before svg
        .style('color', function(d){
            if(d.amount > 0)
                return 'green';
            return 'red';
        })
        .html( function(d, i){
            var text = '';
            
            for(var prop in d) {
                if( prop !== 'id' && prop !== 'longitude' && prop !== 'latitude' ){
                    var propText = d[prop];
                    if( prop === 'time' ) {    // time format
                        propText = moment.unix(propText).format('YYYY-MM-DD HH:mm');
                    }

                    text += '<td>' + propText + '</td>';
                }
            }
            
            return text;
        });
    
}

function updateReportPie(data) {
    
    svg.style('display', 'block');
    
    // group by category
    data = groupByKey(data, 'category');
    
    // sum amounts by category
    for (var i=0; i<data.length; i++) {
        data[i].categorySum = 0;
        for (var v=0; v<data[i].values.length; v++) {
            data[i].categorySum += data[i].values[v].amount;
        }
    }

    //Regular pie chart example
    nv.addGraph(function() {
        var chart = nv.models.pieChart()
          .x(function(d) { return d.key })
          .y(function(d) { return Math.abs(d.categorySum) })
          .showLabels(false);

        svg.datum(data)
            .transition().duration(350)
            .call(chart);

        return chart;
    });
}

function updateReportMap(data) {
    
    $('#map-div').show();
    
    // TODO: get current location
    if( !map ) {
        map = L.map('map-div').setView([51, 0], 14);
    
        L.tileLayer( 'http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
            {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
                maxZoom: 18
            }
        ).addTo(map);
    }
    
    for( var i=0; i<data.length; i++ ){
        console.log(data[i]);
        var lat = data[i].latitude;
        var lon = data[i].longitude;
        var marker = L.marker([lat, lon]).addTo(map);
    }
}
    
function updateReportLine(data) {
    
    svg.style('display', 'block');
    
    data = groupByKey(data, 'category');
    
    //console.log('result', data);
    
    data = fixTimeThicks(data);
                  
    nv.addGraph(function() {
        var chart = nv.models.stackedAreaChart()
                  .margin({right: 50})
                  .x(function(d) { return d.discretedTime })
                  .y(function(d) { return Math.abs(d.amount) })
                  //.useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                  //.transitionDuration(500)
                  //.showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                  .clipEdge(true);

        //Format x-axis labels with custom function.
        chart.xAxis
            .tickFormat(function(d) { 
                return d;
                return d3.time.format('%x')(new Date(d));
        });        

        /*chart.yAxis
            .tickFormat(d3.format(',.2f'));*/

        svg.datum(data)
            .call(chart);

        //nv.utils.windowResize(chart.update);

        return chart;
    });
}

// based on http://stackoverflow.com/a/15888145/1098160
function groupByKey(data, groupingKey) {
    
    var uniqueGroupingKeyValues = {};
    var newData = [];
    
    // build a data structure centered on groupingKey, but without merging values
    for(var i=0; i<data.length; i++){
        if( groupingKey in data[i] ) {
            groupingKeyValue = data[i][groupingKey];
            
            // refresh list of key values
            if( !(groupingKeyValue in uniqueGroupingKeyValues) ){
                uniqueGroupingKeyValues[groupingKeyValue] = {
                    key: groupingKeyValue,
                    values: []
                };
                newData.push( uniqueGroupingKeyValues[groupingKeyValue] );
            }
            
            // add data
            uniqueGroupingKeyValues[groupingKeyValue].values.push(data[i]);
        }      
    }
    
    return newData;
}

function fixTimeThicks(data) {
    
    var verbalTimeSpan = $("[name='radio-span']:checked").data('verbal-span');
    
    var timeThicks = getThicksFromVerbalTimespan(verbalTimeSpan);
    var newData = [];
    
    // Loop over categories
    for(var i=0; i<data.length; i++){
        
        // Recreate empty category
        var categoryObj = {
            key: data[i].key,
            values: []
        };
        
        // Gather already present values
        var timeThicksSum = {};
        for(var j=0; j<data[i].values.length; j++){
            var unixTime = data[i].values[j].time;
            var timeThick = getSingleThickFromUnixAndVerbalTimespan( unixTime, verbalTimeSpan );
            
            if( !(timeThick in timeThicksSum) ){
                timeThicksSum[timeThick] = 0.0;
            }
            timeThicksSum[timeThick] += data[i].values[j].amount;
        } 
        
        // Add a sum value for each time thick
        for(var t=0; t<timeThicks.length; t++){ 
            var amountSum = 0.0;
            if( timeThicks[t] in timeThicksSum ){
                amountSum += timeThicksSum[timeThicks[t]]; 
            }
            
            categoryObj.values.push({
                amount: amountSum,
                discretedTime: timeThicks[t]
            });
        }

        // Add fixed category to new data version
        newData.push(categoryObj);
    }
    
    return newData;
}

function getThicksFromVerbalTimespan( verbalSpan ) {
    
    var thicks = [];
    var nThicks;
    
    if(verbalSpan === 'day') {
        nThicks = 24;
    }
    if(verbalSpan === 'week') {
        nThicks = 7;
    }
    if(verbalSpan === 'month') {
        nThicks = 5;
    }
    if(verbalSpan === 'year') {
        nThicks = 12;
    }
    
    for(var i=0; i<nThicks; i++){
        thicks.push(i);
    }
    return thicks;
}

function getSingleThickFromUnixAndVerbalTimespan( unixTime, verbalSpan ) {
    
    var unixMoment = moment.unix(unixTime);
    
    if(verbalSpan === 'day') {
        return unixMoment.hour();
    }
    if(verbalSpan === 'week') {
        return unixMoment.day();
    }
    if(verbalSpan === 'month') {
        return Math.floor( unixMoment.date() / 7.0 );
    }
    if(verbalSpan === 'year') {
        return unixMoment.month();
    }
}