var sys = require("sys"),  
my_http = require("http"),
fs = require("fs");

var lecture = JSON.parse(fs.readFileSync("ray.js", "utf8").replace('var lecture = ','').replace('\n};','\n}'));

var header = {
    durationInSeconds: lecture.durationInSeconds,
    width: lecture.width, height: lecture.height,
    numStrokes: lecture.visuals.length,
    numTransforms: lecture.cameraTransforms.length,
    pageFlips: lecture.pageFlips
};

lecture.visuals.sort(function(a,b){return a.tMin-b.tMin;});
lecture.cameraTransforms.sort(function(a,b){return a.time-b.time;});

my_http.createServer(function(request,response){ 
    sys.puts("I got kicked");
    response.writeHeader(200, {"Content-Type": "text/plain",
                               "Access-Control-Allow-Origin": "*"});
    var data = require('url').parse(request.url, true).query;
    var answer = "invalid request";
    if(data.want === "header")
        answer = JSON.stringify(header);
    else if(data.want === "visual")
        answer = JSON.stringify(lecture.visuals[parseInt(data.index)]);
    else if(data.want === "transform")
        answer = JSON.stringify(lecture.cameraTransforms[parseInt(data.index)]);
    response.write(answer);
    response.end();
}).listen(8080);  

sys.puts("Server Running on 8080");