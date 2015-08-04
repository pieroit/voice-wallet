// TODO: this file must become a class
var svg;

function initReport(){
    
    console.log('init report');

    svg = d3.select('svg')
        .attr('width', '100%')
        .attr('height', '100%');

    //var width = parseInt( svg.style('width'), 10 );
    //var height = parseInt( svg.style('height'), 10 );
    
    console.log('    retieving last used reportQuery');
    var reportQ = getLatestReportQuery();
    
    // Now we launch a method that will retrieve data based on the query
    // When the data arrive we will build the actual chart
    populateReport(reportQ);
    
    // update report at each control panel event
    $('#dashboard-controls').on('click touchstart', function(){
        var reportQ = getReportQueryFromControlPanel();
        populateReport(reportQ);
    });   
}

function getLatestReportQuery() {
    
    // TODO: there should be a db setting for this
    return {
        'type': 'line',
        'start': 111134124,
        'end': 114343453,
        'valence': 'expense'
    };  
}

function getReportQueryFromControlPanel() {
    // TODO: extract query from the panel and save it into db
    return getLatestReportQuery();
}

function populateReport(reportQ) {
    var data = getData(reportQ);
    
    // update report now
    updateReport(reportQ.type, data);
}

// Based on the reportQuery, retrieve data
function getData(reportQuery){
    
    // TODO: resolve data thick issue:
    // 3 - keep a copy of original queried data
    
    console.log('    getting report data from db', db);
    
    return [
        {
            time: moment('2015-10-20 10:30').unix()*1000,
            import: -300,
            category: 'spesa'
        },
        {
            time: moment('2015-10-21 10:30').unix()*1000,
            import: -200,
            category: 'spesa'
        },
        {
            time: moment('2015-10-21 10:30').unix()*1000,
            import: -20,
            category: 'spesa'
        },
        {
            time: moment('2015-10-24 10:30').unix()*1000,
            import: -130,
            category: 'spesa'
        },
        {
            time: moment('2015-10-21 10:30').unix()*1000,
            import: -3,
            category: 'trasporti'
        },
        {
            time: moment('2015-10-24 10:30').unix()*1000,
            import: -25,
            category: 'trasporti'
        },
        {
            time: moment('2015-10-23 10:30').unix()*1000,
            import: -30,
            category: 'bollette'
        },
        {
            time: moment('2015-10-23 10:30').unix()*1000,
            import: 100,
            category: 'paghetta'
        },
        {
            time: moment('2015-10-24 10:30').unix()*1000,
            import: 1500,
            category: 'stipendio'
        }
    ];
}


// each event in the control panel should fire a redraw
function updateReport(type, data) {
    if(type == 'list'){
        
    } else if(type == 'pie') {
        updateReportPie(data);
    } else if(type == 'line') {
        updateReportLine(data);
    } else if(type == 'map') {
    
    }
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
          .showLabels(true);

        svg.datum(data)
            .transition().duration(350)
            .call(chart);

        return chart;
    });
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