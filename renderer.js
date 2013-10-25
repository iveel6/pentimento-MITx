/*
 *  Renders one frame.
 *  - data: JSON object
 *  - canvas: HTML canvas
 *  - time: timestamp of frame to render
 *
 */

var PentimentoRenderer = function(canvas_container, data) {
    
    var jq_canvas = canvas_container.find('canvas');
    var main_canvas = jq_canvas[0];
    var main_context = main_canvas.getContext('2d');
    
    var freePosition = false;
    var transformMatrix = {
        m11: 1, m12: 0, m21: 0, m22: 1,
        tx: 0, ty: 0
    };
    var playbackID;
    var startTime;
    var main_xscale = main_canvas.width/data.width;
    var main_yscale = main_canvas.height/data.height;
    
    function caller(info) {
        // refocus, select, pan
        if(info.event === 'select') {
            if(info.data !== -1) {
                renderFrame(info.data.tMin);
            }
        }
        else if(info.event === 'pan') {
            freePosition = true;
            transformMatrix.tx += info.data.dx;
            transformMatrix.ty += info.data.dy;
            renderFrame(50);
        }
        else if(info.event === 'refocus') {
            freePosition = false;
            renderFrame(50);
        }
    }
    
    var listener = PentimentoListener(canvas_container, data, caller, main_xscale, main_yscale);

    function renderFrame(time, timeOfPreviousThumb, thumbCanvas) {
        var canvas = thumbCanvas || main_canvas;
        var context = canvas.getContext('2d');
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        var isThumb = timeOfPreviousThumb !== undefined;
        
        if(isThumb) {
            var initialFree = freePosition;
            freePosition = false;
            prepareFrame(time, canvas, context);
            freePosition = initialFree;
        }
        else {
            prepareFrame(time, canvas, context);
            listener.update({
                time: time,
                transformMatrix: transformMatrix
            });
        }
        
        for(var i=0; i<data.visuals.length; i++){
            var currentStroke = data.visuals[i];
            var tmin = currentStroke.tMin;
            var deleted=false;
            
            if(tmin < time){
                var vertices = currentStroke.vertices;
                var properties= currentStroke.properties;
             
                var path = [];
                
                for(var k=0; k<properties.length; k++){
                    
                    var property=properties[k];
                    if (property.time < time) {
                        
                        var fadeIndex = 1;
                        
                        if(property.type === "fadingProperty") {
                            var timeBeginFade = currentStroke.tDeletion+property.timeBeginFade;
                            var fadeDuration = property.durationOfFade;
                            fadeIndex -= (time-timeBeginFade)/fadeDuration;
                            if(fadeIndex < 0)
                                deleted = true;
                        }
                        if(property.type === "basicProperty") {
                            if(currentStroke.tDeletion < time)
                                deleted = true;
                        }
                        
                        if(!deleted || !currentStroke.doesItGetDeleted) {
                            context.fillStyle="rgba("+Math.round(property.redFill*255)+","+Math.round(property.greenFill*255)+
                                              ","+Math.round(property.blueFill*255)+","+(property.alphaFill*fadeIndex)+")";
                            
                            context.strokeStyle="rgba("+Math.round(property.red*255)+","+Math.round(property.green*255)+
                                              ","+Math.round(property.blue*255)+","+(property.alpha*fadeIndex)+")";
                            
                            context.lineWidth = property.thickness*xscale/10;
                            
                            if(isThumb) {
                                if(currentStroke.tEndEdit < timeOfPreviousThumb) {
                                    context.fillStyle = "rgba(100,100,100,0.3)";
                                    context.strokeStyle = "rgba(50,50,50,0.3)";
                                }
                                else
                                    context.lineWidth *= 5;
                            }
                        }
                    }
                }
                
                if (!deleted || !currentStroke.doesItGetDeleted){
                    var previousDrawnIndex = 0;
                    for (var j = 0; j < vertices.length; j++) {
                        var vertex = vertices[j];
                        if (vertex.t < time){
                            if(j==0 | getDistance(vertex, vertices[previousDrawnIndex]) > 1/xscale) {
                                previousDrawnIndex = j;
                                var x=vertex.x*xscale;
                                var y=(data.height-vertex.y)*yscale;
                                var pressure = vertex.pressure;
                                var breaking = vertex.break || false;
                                path.push([x,y,pressure*context.lineWidth*3,breaking]);
                            }
                        }
                        else
                            j = vertices.length;
                    }
                    if(path.length > 0)
                        drawPath(0, path, false, context);
                }
            }
        }
    }
    
    function getThumbCanvas(width, height, time, timeOfPreviousThumb) {
        var thumbCanvas = $('<canvas width='+width+' height='+height+'></canvas>')[0];
        renderFrame(time, timeOfPreviousThumb, thumbCanvas);
        return thumbCanvas;
    }
    
    function prepareFrame(time, canvas, context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        setCameraTransform(time, canvas, context);
    }
    
    function setCameraTransform(time, canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        if(!freePosition) {
            transformMatrix = getCameraTransform(time, canvas);
        }
        
        if(data.preprocessed & freePosition) {
            transformMatrix.m11 = Math.max(transformMatrix.m11, data.minZoom);
            transformMatrix.m22 = Math.max(transformMatrix.m22, data.minZoom);
            transformMatrix.tx = Math.min(Math.max(transformMatrix.tx,
                                                   canvas.width-data.boundingRect.xmax*xscale*transformMatrix.m11),
                                          -data.boundingRect.xmin*xscale*transformMatrix.m11);
            transformMatrix.ty = Math.min(Math.max(transformMatrix.ty,
                                                   canvas.height-data.boundingRect.ymax*yscale*transformMatrix.m22),
                                          -data.boundingRect.ymin*yscale*transformMatrix.m22);
            drawScrollBars(canvas, context);
        }
        
        context.setTransform(transformMatrix.m11, transformMatrix.m12,
                             transformMatrix.m21, transformMatrix.m22,
                             transformMatrix.tx, transformMatrix.ty);
        $('iframe').css('-webkit-transform',
                        'matrix('+transformMatrix.m11/2+','+
                        transformMatrix.m12+','+transformMatrix.m21+','+
                        transformMatrix.m22/2+','+transformMatrix.tx+','+
                        transformMatrix.ty+')');
        
        if(freePosition) {
            freePosition = false;
            var box = getCameraTransform(time, canvas);
            drawBox(box.tx, box.ty, box.m11, box.m22, canvas, context);
            freePosition = true;
        }
    }
    
    function getCameraTransform(time, canvas) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        var cameraChanges = data.cameraTransforms;
        var nextTransform = cameraChanges[cameraChanges.length-1];
        var previousTransform = cameraChanges[0];
        for(var i=0; i<cameraChanges.length; i++){
            var currentTransform = cameraChanges[i];
            if (currentTransform.time < time & currentTransform.time > previousTransform.time) {
                previousTransform = currentTransform;
            }
            if(currentTransform.time > time & currentTransform.time < nextTransform.time) {
                nextTransform = currentTransform;
            }
        }
        var newTransformMatrix = $.extend(true,{},previousTransform);
        if (nextTransform.time !== previousTransform.time) {
            var interpolatedTime = (time - previousTransform.time)/(nextTransform.time - previousTransform.time);
            newTransformMatrix.m11 = previousTransform.m11+(nextTransform.m11 - previousTransform.m11)*interpolatedTime;
            newTransformMatrix.tx = previousTransform.tx+(nextTransform.tx - previousTransform.tx)*interpolatedTime;
            newTransformMatrix.ty = previousTransform.ty+(nextTransform.ty - previousTransform.ty)*interpolatedTime;
        }
        newTransformMatrix.ty = -newTransformMatrix.ty;
        newTransformMatrix.tx = newTransformMatrix.tx/newTransformMatrix.m11*xscale;
        newTransformMatrix.ty = newTransformMatrix.ty/newTransformMatrix.m11*yscale;
        return newTransformMatrix;
    }
    
    function drawPath(startIndex, path, reversed, context) {
        if(startIndex === 0)
            context.beginPath();
        var point = path[startIndex];
        var endIndex = path.length-1;
        context.moveTo(point[0]+point[2],point[1]-point[2]);
        for(var i=startIndex+1; i<path.length-1; i++) {
            point = path[i];
            if(point[3]) { // 
                endIndex = i+1;
                i = path.length-2;
            }
            if(reversed)
                context.lineTo(point[0]-point[2],point[1]+point[2]);
            else
                context.lineTo(point[0]+point[2],point[1]-point[2]);
        }
        for(var i=endIndex; i>=startIndex; i--) {
            point = path[i];
            if(reversed)
                context.lineTo(point[0]+point[2],point[1]-point[2]);
            else
                context.lineTo(point[0]-point[2],point[1]+point[2]);
        }
        point = path[startIndex];
        context.lineTo(point[0]+point[2],point[1]-point[2]);
        if(endIndex !== path.length-1)
            drawPath(endIndex-1, path, !reversed);
        else {
            context.stroke();
            context.fill();
        }
    }
    
    function drawScrollBars(canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        var tx = transformMatrix.tx;
        var ty = transformMatrix.ty;
        var zx = transformMatrix.m11;
        var zy = transformMatrix.m22;
        context.beginPath();
        context.strokeStyle = 'rgba(0,0,0,0.2)';
        context.lineCap = 'round';
        context.lineWidth = 8;
        var scrollBarLeft = (-tx-data.boundingRect.xmin*xscale*zx)/(data.boundingRect.width*xscale*zx)*canvas.width+10;
        var scrollBarTop = (-ty-data.boundingRect.ymin*yscale*zy)/(data.boundingRect.height*yscale*zy)*canvas.height+10;
        var scrollBarWidth = data.width/data.boundingRect.width/zx*canvas.width-20;
        var scrollBarHeight = data.height/data.boundingRect.height/zy*canvas.height-20;
        context.moveTo(scrollBarLeft, canvas.height-10);
        context.lineTo(scrollBarLeft+scrollBarWidth, canvas.height-10);
        context.moveTo(canvas.width-10, scrollBarTop);
        context.lineTo(canvas.width-10, scrollBarTop+scrollBarHeight);
        context.stroke();
    }
    
    function drawBox(tx, ty, zx, zy, canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        context.beginPath();
        context.strokeStyle = 'rgba(0,0,255,0.1)';
        context.lineCap = 'butt';
        context.lineWidth = 5/zx;
        var width = data.width*xscale/zx;
        var height = data.height*yscale/zy
        context.moveTo(-tx, -ty);
        context.lineTo(-tx+width, -ty);
        context.lineTo(-tx+width, -ty+height);
        context.lineTo(-tx, -ty+height);
        context.lineTo(-tx, -ty);
        context.stroke();
    }
    
//    function animateToPos(startTime, duration, tx, ty, tz, nx, ny, nz, callback, bounded) {
//        clearTimeout(animateID);
//        animating = true;
//        displayZoom(nz);
//        
//        if(bounded===undefined) {
//            nz = Math.min(Math.max(nz,minZoom),maxZoom);
//            nx = Math.min(Math.max(nx,canvas.width-boundingRect.xmax*xscale*nz),-boundingRect.xmin*xscale);
//            ny = Math.min(Math.max(ny,canvas.height-boundingRect.ymax*yscale*nz),-boundingRect.ymin*yscale);
//        }
//        
//        var interpolatedTime = Math.pow((Date.now() - startTime)/duration-1,5)+1; // quintic easing
//        
//        if(Date.now()-startTime > duration | (tx === nx & ty === ny & tz === nz)) {
//            animating = false;
//            translateX = nx, translateY = ny, totalZoom = nz;
//            if(callback !== undefined)
//                callback();
//            if(audio.paused) {
//                clearFrame();
//                oneFrame(audio.currentTime);
//            }
//        }
//        else {
//            totalZoom = tz + (nz - tz)*interpolatedTime;
//            translateX = tx + (nx - tx)*interpolatedTime;
//            translateY = ty + (ny - ty)*interpolatedTime;
//            
//            if(audio.paused) {
//                clearFrame();
//                oneFrame(audio.currentTime);
//            }
//            
//            animateID = setTimeout(function() {
//                animateToPos(startTime, duration, tx, ty, tz, nx, ny, nz, callback, true);
//            }, 33);
//        }
//    }
    
    return {renderFrame: renderFrame, getThumbCanvas: getThumbCanvas};
};