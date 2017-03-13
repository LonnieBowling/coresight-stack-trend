(function (CS) {
    'use strict';
    function symbolVis() { };
    CS.deriveVisualizationFromBase(symbolVis);

    symbolVis.prototype.init = function (scope, elem, lbDataService) {
        var vm = this;
        this.onDataUpdate = dataUpdate;
        this.onResize = resize;

        var legendWidth = 200;
        var container = elem.find('#container')[0];
        var id = 'chart_' + Math.random().toString(36).substr(2, 16);
        container.id = id;

        this.config = {
            width : 900,
            height : 400,
            id : id,
            data: null
        };

        this.chart = new CS.lbChart();
        this.chart.init(this.config);

        function resize(width, height) {
            //                        console.log("resize1 w" + width + " h" + height);
            this.chart.width = width - legendWidth;
            this.chart.height = height;
            this.chart.drawChart();

        };

        function dataUpdate(data) {
            if(data) {
                //                console.log("data ",data);
                vm.chart.data = data;
                this.chart.drawChart();
                scope.attributeData = vm.chart.attributeData;
                //                console.log("chart ", vm.chart.chartWidth);
                lbDataService.getData(vm.chart, this.chart.chartWidth).then(function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    //                    console.log("Data Response", response);
                    vm.chart.loadCursorData(response.data);
                    //                    vm.chart.drawChart();
                    //                    console.log("Assigned cursorData ", vm.chart.cursorData);
                    //                    return response;
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Data Response Error", response);
                    //                    return response;
                });
            };
        };
    };

    var definition = {
        typeName: 'lb-stack-trend',
        datasourceBehavior: CS.Extensibility.Enums.DatasourceBehaviors.Multiple,
        inject: ['lbDataService'],
        visObjectType: symbolVis,
        getDefaultConfig: function() {
            return {
                DataShape: 'Trend',
                MultipleScales: true,
                DataQueryMode: CS.Extensibility.Enums.DataQueryMode.ModeEvents,
                // Specify the default height and width of this symbol
                Height: 300,
                Width: 600,
                BackgroundColor: 'orange',
                Text: "testing",
                LegendWidth: '200px'
            };
        },
        // By including this, you're specifying that you want to allow configuration options for this symbol
        configOptions: function () {
            return [{
                // Add a title that will appear when the user right-clicks a symbol
                title: 'Format Symbol',
                // Supply a unique name for this cofiguration setting, so it can be reused, if needed
                mode: 'format'
            }];
        },
    };

    CS.symbolCatalog.register(definition);
})(window.PIVisualization);
