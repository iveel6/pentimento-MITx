function getDistance(v1, v2){
    var x1 = v1.x,
        x2 = v2.x,
        y1 = v1.y,
        y2 = v2.y;
    return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}