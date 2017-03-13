(function(window){
    'use strict';

    angular.module(APPNAME)
        .service('lbDataService', lbDataService);

    lbDataService.$inject = ['$http'];

    function lbDataService ($http) {
        var vm = this;
        var baseURL = 'https://' + window.location.host + '/piwebapi';
        var baseBatchURL = baseURL + '/batch/'
        vm.getData = function(data, intervals){


            //using each point's path, set up a request for the trend data
            var startTime = data.startTime;
            var endTime = data.endTime;
            var mstartTime = moment(startTime, "M/D/YYYY h:m:ss a");
            mstartTime.utc();
            var mendTime = moment(endTime, "M/D/YYYY h:m:ss a");
            mendTime.utc();
            var interval = mendTime.diff(mstartTime)/1000/intervals;
            var timeParms = '?startTime=' + mstartTime.format() + '&endTime=' + mendTime.format() + '&interval=' + interval + 's';

            //af:\\SKYPI05\MBMC\Element1|Attribute1
            //https://40.112.253.122/piwebapi/attributes?path=\\SKYPI05\MBMC\Element1|Attribute1
            //Get each point's path from traces
            var batchRequest = {};
            var pointMetadataReq = [];
            for(var n=0;n<data.attributeData.length;n++){
                var path = data.attributeData[n].Path.substr(3,200);
                pointMetadataReq.push(baseURL+ "/attributes?path=" + path);
                batchRequest["AttributeInfo" + n] = {
                    "Method": 'GET',
                    "Resource": baseURL+ "/attributes?path=" + path
                };
                batchRequest["AttributeData" + n] = {                           
                    "Method": 'GET',
                    "ParentIds": [
                        "AttributeInfo" + n
                    ],
                    "Parameters":[
                        "$.AttributeInfo" + n + ".Content.Links.InterpolatedData"
                    ],
                    "Resource":  "{0}" + timeParms 
                };
            }

            //make the calls
            console.log("Making PI WebAPI Call ", pointMetadataReq);
            return $http({
                method: 'POST',
                url: baseBatchURL,
                data: batchRequest,
                withCredentials: true
            }).then(function successCallback(response) {
                console.log("Point Metatdata Response", response);
                return response;

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log("Point Metadata Response Error", response);
                return response;

            });
        };


    }

})(window);

