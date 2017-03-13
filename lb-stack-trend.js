(function(CS){
    'use strict';
    //
    //    angular.module(APPNAME)
    //        .service('lbchart', lbchart);
    //
    //    lbchart.$inject = ['$http'];

    CS.lbChart = function() {
        var vm = this;

        vm.width = null;
        vm.height = null;
        vm.data = null;
        vm.id = null;
        vm.attributeData = [];
        vm.chartWidth = null;
        vm.cursorData = null;
        vm.startTime = null;
        vm.endTime = null;

        vm.init = function(config)  {
            //            console.log("creatchart enter config=", config);

            vm.width = config.width;
            vm.height = config.height;
            vm.data = config.data;
            vm.id = config.id;
            vm.attributeData = [];
        } ;


        function GetAttributeData (data){
            var results = [];
            var traceCount = data.Traces.length;
            for(var trace=0;trace<traceCount;trace++){
                results.push({
                    Label: data.Traces[trace].Label,
                    Path: data.Traces[trace].Path,
                    Value: data.Traces[trace].Value,
                    Units: data.Traces[trace].Units
                });
            }
            return results;
        };


        vm.parseLineSegment = function(str){
            var result = [];
            str.split(' ').forEach(function(x){
                var arr = x.split(',');
                result.push({'x':+arr[0], 'y': +arr[1]});
            });
            return result;
        };

        vm.filterYAxisData = function(data, height){

            //    console.log("data", data);
            var count = data.length;
            //    console.log("count ", count);
            var rowHeight = 30;
            var maxRows = height/rowHeight;
            //    console.log("maxRows", maxRows);
            var step = Math.round( (count-2)/maxRows);
            //                console.log("step ", step, " height ", height);

            var newData=[data[0]];
            for(var i=step;i<count-step;i+=step){
                if(i<count){
                    newData.push(data[i]);
                }
            }

            newData.push(data[count-1]);
            //            console.log("newData ", newData);
            return newData;
        };

        vm.filterYAxisData1 = function(data, height){

            //    console.log("data", data);
            var count = 10;// data.length;
            var linearScale = d3.scaleLinear()
            .domain([0, 9])
            .range([data[0], data[1]]);
            //    console.log("count ", count);
            var rowHeight = 30;
            var maxRows = height/rowHeight;
            //    console.log("maxRows", maxRows);
            var step = Math.round( (count-2)/maxRows);
            //                console.log("step ", step, " height ", height);

            var newData=[{value:0, label:linearScale(0)}];
            for(var i=step;i<count-step;i+=step){
                if(i<count){
                    newData.push({value:i,label:linearScale(i)});
                }
            }

            newData.push({value:count-1, label:linearScale(count-1)});
            console.log("newData ", newData);
            var tc = d3.ticks(data[0],data[1],maxRows);
            var linearScale2 = d3.scaleLinear()
            .domain([data[0], data[1]])
            .range([0, 100]);
            var newData1 = [];
            for(var n=0;n<tc.length; n++){
                newData1.push(
                    {
                        value: linearScale2(tc[n]),
                        label: tc[n]
                    });

            }
            return newData1;
        };

        vm.loadCursorData = function(data){
            vm.cursorData = [];
            vm.yScales = [];
            for(var n = 0; n < vm.data.Traces.length; n++ ){
                vm.cursorData.push(data["AttributeData" + n].Content.Items);
                //create yScales
                var limits =  vm.data.Traces[n].ValueScaleLimits
                var yTest = d3.scaleLinear()
                .domain([limits[0], limits[1]])
                .range([vm.insideHeightSegement, 0]);
                vm.yScales.push(yTest);
            }
        }

        vm.drawChart = function() {
            vm.svg =  d3.select("#" + vm.id).select("svg").remove();

            vm.svg =  d3.select("#" + vm.id).append("svg");

            vm.svg
                .attr("width", vm.width)
                .attr("height",vm.height);
            var traceCount = vm.data.Traces.length;
            var margin = {top: 16, right: 1, bottom: 20, left: 0};
            var insideWidth = +vm.svg.attr("width") - margin.left - margin.right;
            vm.chartWidth = insideWidth;
            var betweenChartPadding = 5;
            var insideHeight = (+vm.svg.attr("height") - margin.top - margin.bottom);
            var insideHeightSegement = (insideHeight - betweenChartPadding * (traceCount-1)) / traceCount;
            vm.insideHeightSegement = insideHeightSegement;
            vm.betweenChartPadding = betweenChartPadding;
            var insideHeightTop = 0;

            var g = vm.svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var y = d3.scaleLinear()
            .domain([0, 100])
            .range([insideHeightSegement, 0]);

            var x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, insideWidth]);

            var insideHeightBottom = 0;

            if(typeof vm.data.Traces[0].Label !== "undefined"){
                vm.attributeData = GetAttributeData(vm.data);
            }
            vm.startTime = vm.data.StartTime;
            vm.endTime = vm.data.EndTime;

            for(var trace=0;trace<traceCount;trace++){

                if(typeof vm.data.Traces[trace].Label === "undefined"){
                    vm.attributeData[trace].Value = vm.data.Traces[trace].Value;
                }

                var parseTime = d3.timeParse("%m/%d/%Y %H:%M:%S %p");

                var data2 = vm.parseLineSegment(vm.data.Traces[trace].LineSegments[0]);

                var line = d3.line()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });



                var g1 = g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + insideHeightTop  + ")");

                g1.append("line")
                    .attr("class", "axis line1")
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("x2",0)
                    .attr("y2",insideHeightSegement);

                var yAxisDataPush = function (index) {

                }
                var yAxisData = [];
                var yAxisDataCount = vm.data.ValueScalePositions.length;
                for(var yl = 0; yl < yAxisDataCount;yl++){
                    var rowHeight = insideHeight/(yAxisDataCount-1);
                    yAxisData.push({
                        value: vm.data.ValueScalePositions[yl],
                        label: vm.data.ValueScaleLabels[yl],
                    });
                }

                yAxisData = vm.filterYAxisData(yAxisData,insideHeightSegement);
                yAxisData = vm.filterYAxisData1(vm.data.Traces[trace].ValueScaleLimits,insideHeightSegement);

                var yAxisBkgndData = [];
                var backgroundStyle = "background1";
                for(var yl = 0 ; yl < yAxisData.length-1 ;yl++){
                    yAxisBkgndData.push({
                        value: yAxisData[yl].value,
                        background: backgroundStyle
                    });
                    if(backgroundStyle === "background1"){
                        backgroundStyle = "background2";
                    }else{
                        backgroundStyle = "background1";
                    }
                }

                g1.selectAll(".line")
                    .data(yAxisData)
                    .enter().append("line")
                    .attr("class", "axis line1")
                    .attr("x1",0)
                    .attr("y1", function(d) {return y(d.value)})
                    .attr("x2",5)
                    .attr("y2", function(d) {return y(d.value)});

                g1.selectAll(".text")
                    .data(yAxisData)
                    .enter().append("text")
                    .attr("class", "axis text1")
                    .attr("x", 7)
                    .attr("y", function(d,i) {
                    var yPos = y(d.value) + 4;
                    if(i === 0){
                        yPos -= 6;
                    } else if(i==yAxisData.length-1){
                        yPos += 6;
                    };

                    return yPos;
                })
                    .attr("text-anchor", "start")
                    .text(function(d) {return insideHeight > 80 ? d.label : ""});

                g1.selectAll("rect")
                    .data(yAxisBkgndData)
                    .enter().append("rect")
                    .attr("class", function(d) {return "axis " + d.background})
                    .attr("x", 0)
                    .attr("y", function(d) {return y(d.value) - insideHeightSegement/yAxisBkgndData.length})
                    .attr("height", insideHeightSegement/yAxisBkgndData.length)
                    .attr("width", insideWidth);

                g.append("path")
                    .datum(data2)
                    .attr("class", "line")
                    .attr("transform", "translate(0," + insideHeightTop + ")")
                    .attr("d", line);


                //                if(trace==0 && vm.cursorData !== null){
                //                    var xTime = d3.scaleTime()
                //                    .domain([moment(vm.cursorData.AttributeData0.Content.Items[0].Timestamp), moment(vm.cursorData.AttributeData0.Content.Items[vm.cursorData.AttributeData0.Content.Items.length-1].Timestamp)])
                //                    .range([0,insideWidth]);
                //                    console.log("xscale:", xTime.domain(), xTime.range());
                //
                //                    var limits = vm.data.Traces[trace].ValueScaleLimits;
                //
                //                    var yTest = d3.scaleLinear()
                //                    .domain([limits[0], limits[1]])
                //                    .range([insideHeightSegement, 0]);
                //
                //                    //for testing of cursor data
                //                    var lineTime = d3.line()
                //                    .y(function(d) {
                //                        //                        console.log("value, x: ", d.Value, x(d.Value));
                //                        return yTest(d.Value); })
                //                    .x(function(d) {
                //                        //                        console.log("timestamp, x: ", d.Timestamp, xTime(parseTime(d.Timestamp)));
                //                        return xTime(moment(d.Timestamp)); });
                //
                //                    g.append("path")
                //                        .datum(vm.cursorData)
                //                        .attr("class", "line")
                //                        .attr("transform", "translate(0," + insideHeightTop + ")")
                //                        .attr("d", lineTime);
                //                }

                insideHeightTop = insideHeightTop + betweenChartPadding + insideHeightSegement;
            }
            
            //using each point's path, set up a request for the trend data
            var startTime = vm.data.StartTime;
            var endTime = vm.data.EndTime;
            var mstartTime = moment(startTime, "M/D/YYYY h:m:ss a");
            mstartTime.utc();
            var mendTime = moment(endTime, "M/D/YYYY h:m:ss a");
            mendTime.utc();
            var interval = mendTime.diff(mstartTime, 'hours');
            // Add the x Axis
            g.append("g")
                .attr("class", "axis-x1")
                .attr("transform", "translate(0," + insideHeight + ")")
                .call(d3.axisBottom(x).tickSize(-5));

            var yMain = d3.scaleLinear()
            .domain([0, insideHeight])
            .range([insideHeight, 0]);

            g.append("g")
                .attr("class", "axis text1")
                .append("text")
                .attr("text-anchor", "start")
                .attr("x", 0)
                .attr("y", yMain(0 - 15))
                .text(vm.data.StartTime);

            g.append("g")
                .attr("class", "axis text1")
                .append("text")
                .attr("text-anchor", "end")
                .attr("x", insideWidth)
                .attr("y", yMain(0 - 15))
                .text(vm.data.EndTime);

            g.append("g")
                .attr("class", "axis text1")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("x", insideWidth/2)
                .attr("y", yMain(0 - 15))
                .text(interval + "h");

            var xTimeScale = d3.scaleTime()
            .domain([0, insideWidth])
            .range([parseTime(vm.data.StartTime), parseTime(vm.data.EndTime)]);

            var overlay = vm.svg.append("g")
            .attr("class", "overlay");
            overlay.append("rect")
                .attr("class", "area")
                .attr("width", insideWidth)
                .attr("height", insideHeight)
                .attr("x",margin.left)
                .attr("y",margin.top)
                .on("click", chartClick);

            updateToolTip();

            function dragstarted(d, i) {
                //                console.log("dragstarted");
                d3.select(this).raise().classed("toolTip-active", true);
            }

            function dragged(d, i) {
                //                console.log("d, i", d, i);
                d.x += d3.event.dx;
                d3.select(this)
                    .attr("transform", "translate(" +  d.x + "," + d.y + ")");
                d3.select(this).select("#header")
                    .text(function(d){return shortTimeFormat(xTimeScale(parseInt(d.x+toolTipWidth/2)))});
                d3.select(this).select("#value")
                    .text(function(d){return parseInt(d.x+toolTipWidth/2)});

                //                console.log("time: ", xTimeScale(d.x));
            }

            function dragended(d) {
                //                console.log("dragended");
                d3.select(this).classed("toolTip-active", false);
            }

            function toolTipClick(){
                //                console.log("toolTipClick");
                //            d3.event.stopPropagation();
            }

            var toolTipCollection = [];
            var shortTimeFormat = d3.timeFormat("%X");
            var toolTipWidth = 46;



            function chartClick (){
                var coordinates = [0, 0];
                coordinates = d3.mouse(this);
                var x = coordinates[0];
                var y = coordinates[1];
                toolTipCollection.push({
                    x: x,
                    y: margin.top,
                    index: parseInt(x+toolTipWidth/2),
                    vm: vm
                });
                updateToolTip();
            }

            function updateToolTip(){

                if(typeof toolTipCollection === "undefined") return;

                var toolTipGroup = overlay.selectAll('g').
                data(toolTipCollection);

                toolTipGroup.exit().remove();

                var toolTipItem = toolTipGroup.enter().append("g")
                .attr("transform", function(d){ return "translate(" + d.x + "," + d.y + ")"})
                .raise()
                .on("click", toolTipClick)
                .on("mousemove", mousemove)
                .call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", function(d,i){
                    d.x += d3.event.dx;
                    d.index = parseInt(d.x+toolTipWidth/2);
                    d3.select(this)
                        .attr("transform", "translate(" +  d.x + "," + d.y + ")");
                    d3.select(this).select("#header")
                        .text(function(d){return shortTimeFormat(xTimeScale(parseInt(d.x+toolTipWidth/2)))});
                    var temp = d3.select(this).selectAll(".valueLabel")
                    .attr("y", function(d,i,j) {return toolTipYValue(d, i, j)})
                    .text(function(d,i,j){return formatValue(d, i, j);});
                })
                      .on("end", dragended));
                toolTipItem.append("rect")
                    .attr("class", "toolTip")
                    .attr("width", toolTipWidth)
                    .attr("height", insideHeight)
                    .attr("x",0)
                    .attr("y",0);
                toolTipItem.append("line")
                    .attr("class", "toolTip-line")
                    .attr("x1",toolTipWidth/2)
                    .attr("y1",0)
                    .attr("x2",toolTipWidth/2)
                    .attr("y2",insideHeight);
                toolTipItem.append("text")
                    .attr("class", "toolTip-text")
                    .attr("id", "header")
                    .attr("text-anchor", "middle")
                    .attr("x", toolTipWidth/2)
                    .attr("y", -2)
                    .text(function(d){return shortTimeFormat(xTimeScale(parseInt(d.x+toolTipWidth/2)))});


                toolTipItem.selectAll('g')
                    .data(function(d) { return d.vm.cursorData;})
                    .enter()
                    .append("text")
                    .attr("class", "toolTip-text valueLabel")
                    .attr("text-anchor", "end")
                    .attr("x", toolTipWidth/2)
                    .attr("y", function(d,i,j) {return toolTipYValue(d, i, j)})
                    .text(function(d, i, j){return formatValue(d, i, j)});
            }

            function formatValue(d, i, j){
                var index = j[i].parentNode.__data__.index;
                var num = d[index].Value.toFixed(2);
                return num;
            }

            function toolTipYValue(d, i, j){
                var index = j[i].parentNode.__data__.index;
                var value = d[index].Value;
                var n = vm.yScales[i];
                var top = insideHeight/traceCount * i;
                var yRange = n(value);
                return top + yRange;
            }

            function mousemove() {
                var coordinates = [0, 0];
                coordinates = d3.mouse(this);
                var x = coordinates[0];
                var y = coordinates[1];
                //            console.log("x: " + x +" y: " + y);
            }

        };

        //        vm.getData = function(){
        //            console.log("Making PI WebAPI Call");
        //            $http({
        //                method: 'GET',
        //                url: 'https://40.112.253.122/piwebapi/streams/P0Nv97mHFmhkas3tPSNEAM-QAwAAAAU0tZUEkwNVxDRFQxNTg/plot',
        //                withCredentials: true
        //            }).then(function successCallback(response) {
        //                // this callback will be called asynchronously
        //                // when the response is available
        //                console.log("PWA Response", response);
        //            }, function errorCallback(response) {
        //                // called asynchronously if an error occurs
        //                // or server returns response with an error status.
        //                console.log("PWA Response Error", response);
        //            });
        //        };
    }

})(window.PIVisualization);

