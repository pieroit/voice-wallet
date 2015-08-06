// TODO: this file must become a class
var svg;
var map;

function initReport(){
    
    console.log('init report');

    svg = d3.select('svg')
        .attr('width', '100%')
        .attr('height', '100%');

    //var width = parseInt( svg.style('width'), 10 );
    //var height = parseInt( svg.style('height'), 10 );
    
    console.log('    retieving last used reportQuery');
    var reportQ = getLatestReportQuery();
    
    // update report at each control panel event
    function updateReport() {
        
        // delete actual report contents and put on a loading gif
        $('#map-div').hide();
        $('#report-div').empty();
        svg.selectAll('*').remove();
        
        // extract report query
        var reportQ = getReportQueryFromControlPanel();
        
        // update report
        populateReport(reportQ);
    }
    
    $('#dashboard-controls').on('change', updateReport );
    $('#time-span-buttons').on('click touchstart', updateReport );
    
    updateReport();
}

function getLatestReportQuery() {
    
    // TODO: there should be a db setting for this
    
    
    // if not present in db, return default (or just put default in the DB)
    return {
        'type': 'pie',
        'start': 111134124,
        'end': 114343453,
        'valence': 'expense'
    };  
}

// extract query from the panel and save it into db before return it
function getReportQueryFromControlPanel() {
    
    var timeSpanStart = $('#time-span-button-start').data('time-span-start');
    var timeSpanEnd = $('#time-span-button-end').data('time-span-end');
    
    var reportQuery = {
        'type': $("[name='radio-type']:checked").val(),
        'start': timeSpanStart,
        'end': timeSpanEnd,
        'valence': $("[name='radio-valence']:checked").val()
    };
    
    console.log('report Query', reportQuery);
    
    // TODO: return the scraped query
    return reportQuery;
    //return getLatestReportQuery();
}

// Based on the reportQuery, retrieve data
function populateReport(reportQuery){
    
    // TODO: resolve data thick issue:
    // 3 - keep a copy of original queried data
    
    console.log('    getting report data from db');
    
    getRecords( reportQuery, function(tx, results){
        
        var data = [];

        for(var i=0; i<results.rows.length; i++){
            data.push( results.rows.item(i) );
        }
        
        // update report with queried data
        updateReport(reportQuery.type, data);
    } );

}


// each event in the control panel should fire a redraw
function updateReport(type, data) {
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
    
    d3.select('#report-div')
        .selectAll('div')
        .data(data)
        .enter()
        .insert('div', 'svg')   // append before svg
        .text( function(d, i){
            var text = '' + i;
            
            for(var prop in d) {
                var propText = d[prop];
                if( prop === 'time' ) {    // time property
                    propText = moment.unix(propText).format('YYYY-MM-DD HH:mm');
                }
                
                text += ' | ' + propText;
            }
            return text;
        });
    
}

function updateReportPie(data) {
    
    // group by category
    data = groupByKey(data, 'category');
    
    // sum imports by category
    for (var i=0; i<data.length; i++) {
        data[i].categorySum = 0;
        for (var v=0; v<data[i].values.length; v++) {
            data[i].categorySum += data[i].values[v].import;
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
    }
    
    L.tileLayer( 'http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
        {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 18
        }
    ).addTo(map);
    
    for( var i=0; i<data.length; i++ ){
        console.log(data[i]);
        var lat = data[i].latitude;
        var lon = data[i].longitude;
        var marker = L.marker([lat, lon]).addTo(map);
    }
}
    
function updateReportLine(data) {
    
    data = groupByKey(data, 'category');
    
    //console.log('result', data);
    
    data = fixTimeThicks(data, 'hours');
    
    //console.log(data);
    
    /*data = [{ 
      "key" : "spesa" , 
      "values" : [
        { time: 1025409600000 , import: 23.041422681023},
        { time: 1028088000000 , import: 19.854291255832},
        { time: 1038632400000 , import: 21.02286281168},
        { time: 1038632600000 , import: 26.982389242348}
      ]},
        {
        "key" : "trasporti", 
      "values" : [
        { time: 1025409600000 , import: 22.093608385173},
        { time: 1028088000000 , import: 25.108079299458},
        { time: 1038632400000 , import: 26.982389242348},
        { time: 1038632600000 , import: 26.982389242348}
      ]
    }];*/
                  
    nv.addGraph(function() {
        var chart = nv.models.stackedAreaChart()
                  .margin({right: 50})
                  .x(function(d) { return d.discretedTime })
                  .y(function(d) { return Math.abs(d.import) })
                  //.useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                  //.transitionDuration(500)
                  //.showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                  .clipEdge(true);

        //Format x-axis labels with custom function.
        /*chart.xAxis
            .tickFormat(function(d) { 
              return d3.time.format('%x')(new Date(d)) 
        });*/        

        chart.yAxis
            .tickFormat(d3.format(',.2f'));

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

function fixTimeThicks(data, timeRange) {
    
    var timeThicks = [0,1,2,3,4,5,6];
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
            var timeThick = moment(data[i].values[j].time).day();
            
            if( !(timeThick in timeThicksSum) ){
                timeThicksSum[timeThick] = 0.0;
            }
            timeThicksSum[timeThick] += data[i].values[j].import;
        } 
        
        // Add a sum value for each time thick
        for(var t=0; t<timeThicks.length; t++){ 
            var importSum = 0.0;
            if( timeThicks[t] in timeThicksSum ){
                importSum += timeThicksSum[timeThicks[t]]; 
            }
            
            categoryObj.values.push({
                import: importSum,
                discretedTime: timeThicks[t]
            });
        }

        // Add fixed category to new data version
        newData.push(categoryObj);
    }
    
    return newData;
}