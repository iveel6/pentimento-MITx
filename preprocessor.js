var boundingRect;

function preprocess(data, e) {
    data.preprocessed = true;
    boundingRect = {xmin: 0, xmax: 0,
                    ymin: 0, ymax: 0,
                    width: 0,
                    height: 0};
    boundingRect.width = data.width;
    boundingRect.height = data.height;
    for(var i=0; i<data.visuals.length; i++)
        data.visuals[i].vertices = RDPalg(data.visuals[i].vertices, e);
    boundingRect.width = boundingRect.xmax-boundingRect.xmin;
    boundingRect.height = boundingRect.ymax-boundingRect.ymin;
    data.boundingRect = boundingRect;
    data.minZoom = Math.min(data.width/boundingRect.width,data.height/boundingRect.height);
}

function RDPalg(vertices, e) {
    if(vertices.length < 3)
        return vertices.slice(0);
    var maxDist = 0;
    var index = 0;
    for(var i=1; i<vertices.length-1; i++) {
        boundingRect.xmin = Math.min(boundingRect.xmin, vertices[i].x);
        boundingRect.xmax = Math.max(boundingRect.xmax, vertices[i].x);
        boundingRect.ymin = Math.min(boundingRect.ymin, boundingRect.height-vertices[i].y);
        boundingRect.ymax = Math.max(boundingRect.ymax, boundingRect.height-vertices[i].y);
        var dist = distToLine(vertices[i], vertices[0], vertices[vertices.length-1]);
        if(dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }
    if(maxDist > e) {
        var left = RDPalg(vertices.slice(0,index), e);
        var right = RDPalg(vertices.slice(index), e);
        return left.concat(right);
    }
    else
        return [vertices[0], vertices[vertices.length-1]];
}

function distToLine(point, begin, end) {
    var ax = point.x-begin.x;
    var ay = point.y-begin.y;
    var bx = end.x-begin.x;
    var by = end.y-begin.y;
    var dot = (ax*bx+ay*by)/(bx*bx+by*by);
    var cx = ax-dot*bx;
    var cy = ay-dot*by;
    return Math.sqrt(cx*cx+cy*cy);
}