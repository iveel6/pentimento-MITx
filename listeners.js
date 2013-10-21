var PentimentoListener = function(canvascontainer, data, caller, xscale, yscale) {
    var jqcanvas = canvascontainer.find("canvas");
    var canvas = jqcanvas[0];
    var context = canvas.getContext('2d');
    var offset = jqcanvas.offset();
    var minDistance = 20;
    var furthestTime = 0;
    var transformMatrix = {m11: 1, m12: 0, m21: 0, m22: 1, tx: 0, ty: 0};
    
    function selectStroke(x, y){
        x = Math.round((x-offset.left-transformMatrix.tx)/transformMatrix.m11)/xscale;
        y = data.height-Math.round((y-offset.top-transformMatrix.ty)/transformMatrix.m22)/yscale;
        var closestPoint={stroke:-1,distance:(minDistance*xscale)};
        for(var i=0; i<data.visuals.length; i++){ //run though all strokes
            var currentStroke=data.visuals[i];
            var deletedYet=false;
            if (currentStroke.doesItGetDeleted){
                if (currentStroke.tDeletion<furthestTime) deletedYet=true;
            }
            for(var j=0;j<currentStroke.vertices.length; j++){ //run through all verticies
                if (currentStroke.vertices[j].t<furthestTime & !deletedYet){
                    //check closeness of x,y to this current point
                    var dist = getDistance({x:x,y:y},currentStroke.vertices[j]);
                    if (dist<closestPoint.distance){ //this point is closer. update closestPoint
                        closestPoint.distance=dist;
                        closestPoint.stroke=currentStroke;
                    }
                }
            }
        }
        return closestPoint.stroke;
    }
    
    function selectPolygon(polygon) {
        for(var i=0; i<polygon.length; i++) {
            polygon.x = Math.round((polygon.x-offset.left-transformMatrix.tx)/transformMatrix.m11)/xscale;
            polygon.y = data.height-Math.round((polygon.y-offset.top-transformMatrix.ty)/transformMatrix.m22)/yscale;
        }
        var selected = [];
        for(var i=0; i<data.visuals.length; i++){ //run though all strokes
            var currentStroke=data.visuals[i];
            var deletedYet=false;
            if (currentStroke.doesItGetDeleted){
                if (currentStroke.tDeletion<furthestTime) deletedYet=true;
            }
            var percentage = 0;
            for(var j=0;j<currentStroke.vertices.length; j++){ //run through all verticies
                if (currentStroke.vertices[j].t<furthestTime & !deletedYet){
                    if(isPointInPoly(polygon, currentStroke.vertices[j]))
                        percentage += 1;
                }
            }
            if(percentage/currentStroke.vertices.length >= 0.8)
                selected.push(currentStroke);
        }
        return selected;
    }
    
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
    function isPointInPoly(poly, pt){
        for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
            && (c = !c);
        return c;
    }
    
    function pan(dx, dy) {
        caller({
            event: 'pan',
            data: {dx: dx, dy: dy}
        });
    }
    
    var mousePressed = false;
    var mouseDragged = false;
    var previousX, previousY;
    
    function mouseDown(e) {
        mousePressed = true;
        mouseDragged = false;
        previousX = e.pageX;
        previousY = e.pageY;
    }
    
    function mouseMove(e) {
        var x = e.pageX,
            y = e.pageY;
        if(mousePressed) { // dragging motion
            mouseDragged = true;
            var newTx = (x-previousX);
            var newTy = (y-previousY);
            pan(newTx, newTy);
            previousX = x;
            previousY = y;
        }
    }
    
    function mouseUp() {
        mousePressed = false;
        if(!mouseDragged) { // if clicked
            caller({
                event: 'select',
                data: selectStroke(previousX,previousY)
            });
        }
    }
    
    function keyDown(e) {
        var keyCode = e.keyCode || e.which;
        if(keyCode === 13)
            caller({event: 'refocus'});
    }
    
    function doubleClickHandler(input) {
        var element = input.element;
        var down = input.down;
        var move = input.move;
        var up = input.up;
        var double = input.double;
        var tolerance = input.tolerance;
        var doubled = false;
        function offClick() {
            element.off('mouseup mousedown mousemove');
        }
        function offTap() {
            element.off('touchstart touchmove touchend');
        }
        function onClick() {
            element.on('mouseup', listenClick);
            element.on('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                down(e);
            });
            element.on('mousemove', move);
        }
        function on() {
            setTimeout(onClick,tolerance*4);
            element.on('touchstart', function(e) {
                offClick();
                down(e.originalEvent.touches[0]);
            });
            element.on('touchmove', function(e) {
                e.preventDefault();
                e.stopPropagation();
                offClick();
                move(e.originalEvent.touches[0]);
            });
            element.on('touchend', function(e) {
                offClick();
                listenTap(e);
                setTimeout(onClick,tolerance*4);
            });
        }
        function listenClick(e) {
            offClick();
            doubled = false;
            var click = setTimeout(function() {
                up();
                element.off('mouseup');
                on();
            },tolerance);
            element.on('mouseup', function() {
                clearTimeout(click);
                double(e, e.target);
                doubled = true;
                element.off('mouseup');
                on();
            });
        }
        function listenTap(e) {
            offTap();
            doubled = false;
            var tap = setTimeout(function() {
                offClick();
                up();
                element.off('touchend');
                on();
            },tolerance);
            element.on('touchend', function() {
                offClick();
                clearTimeout(tap);
                double(e.originalEvent.changedTouches[0], e.target);
                doubled = true;
                element.off('touchend');
                on();
            });
        }
        on();
    }
    
    doubleClickHandler({
        element: $(window),
        down: function(e) {
            if(e.target === canvas)
                mouseDown(e);
        },
        move: mouseMove,
        up: mouseUp,
        double: function(e, target) {
//            if(target === canvas) {
//                setFreePosition(true);
//                var x = e.pageX-offset.left,
//                    y = e.pageY-offset.top;
//                mousePressed = false;
//                var nz = totalZoom===1?2:1;
//                animateZoom(nz, x, y);
//            }
        },
        tolerance: 200
    });
    $(window).on('keydown', keyDown);
    
    canvascontainer[0].addEventListener('mousewheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        pan(e.wheelDeltaX || 0, e.wheelDeltaY || e.wheelDelta);
    });
    
    function update(info) {
        furthestTime = info.time;
        transformMatrix = info.transformMatrix;
    }
    
    return {update: update};
};