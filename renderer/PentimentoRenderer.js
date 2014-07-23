/**
 * - canvas_container: the jQuery-wrapped element which contains the canvas (not the canvas itself)
 * - data: the raw lecture data Javascript object
 * - resourcepath: the path to resources (images, etc)
 */
var PentimentoRenderer = function(canvas_container, data, resourcepath) {
    console.log(data.boundingRect)
    var jq_canvas = canvas_container.find("canvas");
    var main_canvas = jq_canvas[0];
    var main_context = main_canvas.getContext('2d');
    var background_canvas = $('#background_canvas')[0];
    var background_context = background_canvas.getContext('2d');
    var overlay_canvas = $('#overlay_canvas')[0];
    var overlay_context = overlay_canvas.getContext('2d');  //this is for the scroll bars and possibly strokes in the future.
    var freePosition = false;
    var transformMatrix = {
        m11: 1, m12: 0, m21: 0, m22: 1,
        tx: 0, ty: 0
    };
    var prevtransformMatrix = {};
    var prevTime;
    var fastRenderFrames = 0;
    var timeOfLastUpdate = 0;
    var framesInSeconds = 0;
    var QUALITY_INDEX = 3; //make this higher for higher performance and lower quality
                           //make this 0 for maximized quality and should be identical to the old rendering
                           //at the current iteration of 7/18/2014, also affects the FPS of embedded videos (Max_FPS = 60/(1+quality))
                           //setting this from 0 to 5 resulted on a 50% increase in performance.
    var animateID;
    var startTime;
    var main_xscale = main_canvas.width/data.width;
    var main_yscale = main_canvas.height/data.height;
    var size = $('.video')[0].height
    // wrap all raw visual objects in wrapper renderer classes
    for (var i in data.visuals) {
        if (data.visuals[i].type === 'stroke')
            data.visuals[i] = new Stroke(data.visuals[i]);
        else if(data.visuals[i].type === 'image')
            data.visuals[i] = new Image(data.visuals[i], resourcepath);
        else if(data.visuals[i].type === 'pdf')
            data.visuals[i] = new Pdf_Wrapper(data.visuals[i], resourcepath);
        else if(data.visuals[i].type === 'video')
            data.visuals[i] = new Pentimento_video(data.visuals[i], resourcepath);
        else if(data.visuals[i].type === 'iframe')
            data.visuals[i] = new Pentimento_iframe(data.visuals[i])
        else if(data.visuals[i].type === 'quiz')
            data.visuals[i] = new Pentimento_quiz(data.visuals[i])
        else
            console.log('Unknown type: '+data.visuals[i].type);
    }
    if (data.hasSlides){
      var slides = new Slide_Wrapper(data.height,data.width,resourcepath)
      data.visuals.unshift(slides);
    }
    for (var i in data.audios){
            Pentimento_audio(data.audios[i], resourcepath)
    }
    
    /**
     * Responds to events fired by PentimentoListener
     */
    this.fire = function (info) {
        if(info.event === 'pan') {
            freePosition = true;
            transformMatrix.tx += info.data.dx;
            transformMatrix.ty += info.data.dy;
            if(info.data.paused) this.renderFrame(info.data.time);
        }
        else if(info.event === 'zoomIn') {
            freePosition = true;
            animateZoom(Math.min(transformMatrix.m11*3/2,data.maxZoom), info.data);
        }
        else if(info.event === 'zoomOut') {
            freePosition = true;
            animateZoom(Math.max(transformMatrix.m11*2/3,data.minZoom), info.data);
        }
        else if(info.event === 'doubleclick') {
            freePosition = true;
            animateZoom(transformMatrix.m11===1?2:1, info.data, info.data.cx, info.data.cy);
        }
        else if(info.event === 'minZoom') {
            freePosition = true;
            animateZoom(data.minZoom, info.data);
        }
        else if(info.event === 'refocus') {
            if(freePosition) {
                animateToPos(getCameraTransform(info.data.time+0.5, main_canvas), 500, info.data, function() {
                    freePosition = false;
                });
            }
        }
        else if(info.event === 'resize') {
            
            var f = $('.video')[0].height/size
            size = $('.video')[0].height
            transformMatrix.ty *= f
            transformMatrix.tx *= f
           
            main_xscale = main_canvas.width/data.width;
            main_yscale = main_canvas.height/data.height;
        }
    }

    // for tracking FPS
    var fps = 0, timeOfLastFrame = 0;
    
    /**
     * Render a frame at 'time'.
     * 'timeOfPreviousThumb' and 'thumbCanvas' are defined if rendering thumbnails.
     */
    function renderFrame(time, timeOfPreviousThumb, thumbCanvas) {
        
        // get retimed time
        time = audioToVisual(data, time);
        
        // determine which canvas to render on (main or thumb)
        var canvas = thumbCanvas || main_canvas;
        var context = canvas.getContext('2d');
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        var isThumb = timeOfPreviousThumb !== undefined;
        
        // ignore user transform if rendering a thumbnail
        if(isThumb) {
            var initialFree = freePosition;
            freePosition = false;
            prepareFrame(time, canvas, context);
            freePosition = initialFree;
            fullRender(time,context,xscale,yscale,timeOfPreviousThumb);
        }
        else {
            if (JSON.stringify(prevtransformMatrix) == JSON.stringify(transformMatrix) && Math.abs(time-prevTime) < 0.2 && fastRenderFrames < QUALITY_INDEX) 
            {
              fastRender(time, prevTime, context, xscale, yscale, timeOfPreviousThumb)
              fastRenderFrames += 1
            }else{
              fastRenderFrames = 0;
              prepareFrame(time,canvas,context);
              fullRender(time,context, xscale, yscale, timeOfPreviousThumb);
            }
            prevTime = time;
            //sigh, passing by reference.
            prevtransformMatrix = $.extend({},transformMatrix);;
        }

        // display FPS
        if (!isThumb) {
            var timeOfThisFrame = Date.now();
            if (timeOfThisFrame - timeOfLastUpdate < 1000){
              framesInSeconds += 1
            }else{
              fps = framesInSeconds
              $('#fps').html(fps+' FPS');
              framesInSeconds = 0;
              timeOfLastUpdate = timeOfThisFrame;
            }
            timeOfLastFrame = timeOfThisFrame;
        }
    }
    this.renderFrame = renderFrame;
    
    /*
     * renders only the new visuals between the two times
     * called when the transform matrix doesn't change (the old stuff is still useful.)
     * takes about 2ms.
     */
    function fastRender(time, previoustime, context, xscale, yscale, timeOfPreviousThumb){
      for(var i=0; i<data.visuals.length; i++){
        if (data.visuals[i].isBetweenTime(previoustime, time)){ //|| data.visuals[i].getType() == 'video'){
          data.visuals[i].render(time, context, xscale, yscale, timeOfPreviousThumb, transformMatrix);
        }
      }
    }
    /*    
     *renders all the visuals.
     *called after transformation matrix changes, or once in every (QUALITY_INDEX+1) frames
     *now optimized to check if the visual obj is within view <- causes bugs in fullscreen
     *takes up to 30ms (10 fold slower)
     */
    
    function fullRender(time, context, xscale, yscale, timeOfPreviousThumb){
      for(var i=0; i<data.visuals.length; i++){
          data.visuals[i].render(time, context, xscale, yscale, timeOfPreviousThumb, transformMatrix);
      }
    }
    /**
     * Returns a jQuery-wrapped canvas of the specified size rendered with a frame
     * at the specified time.
     */
    this.getThumbCanvas = function (width, height, time, timeOfPreviousThumb) {
        var thumbCanvas = $('<canvas width='+width+' height='+height+'></canvas>')[0];
        this.renderFrame(time, timeOfPreviousThumb, thumbCanvas);
        return thumbCanvas;
    }
    
    /**
     * Prepare the canvas for rendering a new frame.
     */
    function prepareFrame(time, canvas, context) {
        // clear the canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0,0,canvas.width,canvas.height)
        // patch. this reduces workload by not filling the background every frame.
        if(canvas.id == 'main_canvas'){
          fillBackground();
        }else{
          context.fillStyle = 'rgb('+Math.round(data.backgroundColor.red*255)+','+
          Math.round(data.backgroundColor.green*255)+','+Math.round(data.backgroundColor.blue*255)+')';
          context.fillRect(0, 0, canvas.width, canvas.height)
        }
        // set the transform
        setCameraTransform(time, canvas, context);
    }
  
    function fillBackground(){
      if (background_canvas.width != main_canvas.width && background_canvas.height != main_canvas.height){
        background_canvas.width = main_canvas.width
        background_canvas.height = main_canvas.height
        overlay_canvas.width = main_canvas.width
        overlay_canvas.height = main_canvas.height
        background_context.fillStyle = 'rgb('+Math.round(data.backgroundColor.red*255)+','+
          Math.round(data.backgroundColor.green*255)+','+Math.round(data.backgroundColor.blue*255)+')';
        background_context.fillRect(0, 0, background_canvas.width, background_canvas.height);
      }
    }
    
    /**
     * Transform the canvas context, update transformMatrix
     */
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
            
            // draw fake scrollbars
            drawScrollBars(overlay_canvas, overlay_context);
        }
        
        context.setTransform(transformMatrix.m11, transformMatrix.m12,
                             transformMatrix.m21, transformMatrix.m22,
                             transformMatrix.tx, transformMatrix.ty);
        
            
    }
    
    /**
     * Return the interpolated camera transform matrix for the given time
     */
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
            newTransformMatrix.m22 = previousTransform.m22+(nextTransform.m22 - previousTransform.m22)*interpolatedTime;
            newTransformMatrix.tx = previousTransform.tx+(nextTransform.tx - previousTransform.tx)*interpolatedTime;
            newTransformMatrix.ty = previousTransform.ty+(nextTransform.ty - previousTransform.ty)*interpolatedTime;
        }
        newTransformMatrix.tx = newTransformMatrix.tx/newTransformMatrix.m11*xscale;
        newTransformMatrix.ty = newTransformMatrix.ty/newTransformMatrix.m22*yscale;
        return newTransformMatrix;
    }
    
    /**
     * Draws fake scrollbars on the canvas
     */
    function drawScrollBars(canvas, context) {
        context.clearRect(0,0,canvas.width,canvas.height)
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
    
    /**
     * Draws a blue bounding box showing camera transform position relative to user transform
     */
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
    
    /**
     * Animates the frame using quintic easing from an old transform (tx, ty, tz)
     * to a new transform (nx, ny, nz)
     */
    function animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, bounded) {
        clearTimeout(animateID);
        if(bounded===undefined) {
            nz = Math.min(Math.max(nz,data.minZoom),data.maxZoom);
            nx = Math.min(Math.max(nx,main_canvas.width-data.boundingRect.xmax*main_xscale*nz),-data.boundingRect.xmin*main_xscale);
            ny = Math.min(Math.max(ny,main_canvas.height-data.boundingRect.ymax*main_yscale*nz),-data.boundingRect.ymin*main_yscale);
        }
        
        var interpolatedTime = Math.pow((Date.now() - startTime)/duration-1,5)+1; // quintic easing
        
        if(Date.now()-startTime > duration | (tx === nx & ty === ny & tz === nz)) {
            transformMatrix.tx = nx, transformMatrix.ty = ny, transformMatrix.m11 = nz, transformMatrix.m22 = nz;
            if(callback !== undefined)
                callback();
            if(info.paused) {
                renderFrame(info.time);
            }
        }
        else {
            transformMatrix.m11 = tz + (nz - tz)*interpolatedTime;
            transformMatrix.m22 = transformMatrix.m11;
            transformMatrix.tx = tx + (nx - tx)*interpolatedTime;
            transformMatrix.ty = ty + (ny - ty)*interpolatedTime;
            
            if(info.paused) {
                renderFrame(info.time);
            }
            
            animateID = setTimeout(function() {
                animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, true);
            }, 33);
        }
    };
    function animateToPos(newMatrix, duration, info, callback) {
        animateToPosHelper(Date.now(), duration, transformMatrix.tx, transformMatrix.ty, transformMatrix.m11,
                           newMatrix.tx, newMatrix.ty, newMatrix.m11, info, callback);
    }
    
    /**
     * Animation for zoom-only transforms.
     * Zooms in on center of visible display.
     */
    function animateZoom(nz, info, cx, cy) {
        if(cx === undefined)
            cx = main_canvas.width/2;
        if(cy === undefined)
            cy = main_canvas.height/2;
        var nx = transformMatrix.tx + (1-nz/transformMatrix.m11)*(cx-transformMatrix.tx);
        var ny = transformMatrix.ty + (1-nz/transformMatrix.m22)*(cy-transformMatrix.ty);
        freePosition = true;
        animateToPos({m11: nz, m12: 0, m21: 0, m22: nz, tx: nx, ty: ny}, 500, info);
    };
    
    // returns the current context transform
    this.transformMatrix = function () {
        return transformMatrix;
    }
};