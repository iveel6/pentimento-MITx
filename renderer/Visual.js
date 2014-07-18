/**
 * A superclass for rendering a Visual object
 */
var Visual = function (visual) {
    
    /**
     * Get the current display property of the visual
     */
    function getProperty(time) {
        return visual.properties[visual.properties.length-1];
    }
    this.getProperty = getProperty;
  
    //this is used to determine whether this visual is new in between two frames.
    function isBetweenTime(time1, time2){
        return visual.tMin > time1 && visual.tMin < time2
    }
    this.isBetweenTime = isBetweenTime;
    
    //this is used to see if the visual updates itself. 
    //as of 7/17/2014, only videos do.
    function getType(){
        return visual.type
    }
  
    function checkbounds(context, tM){
        return (tM.ty + visual.y * tM.m22)>0 && (tM.tx + visual.x * tM.m11)>0
    }
    this.checkbounds = checkbounds;
    this.getType = getType;
    /**
     * Get the current transform of the visual
     */
    function getTransform(time) {
        for(var i=1; i<visual.transforms.length; i++) {
            if(visual.transforms[i].time > time)
                return visual.transforms[i-1];
        }
        return visual.transforms[visual.transforms.length-1];
    }
    this.getTransform = getTransform;
    
    /**
     * Render the visual according to 'time' on 'context', with the specified 'xscale' and 'yscale' ratios.
     * 'timeOfPreviousThumb' is defined if rendering thumbnails; specifies the time before which
     *      strokes should be grayed out.
     */
    function render(time, context, xscale, yscale, timeOfPreviousThumb, transformMatrix) {
        if (time > visual.tMin && this.checkbounds(context, transformMatrix)) {
            var transform = this.getTransform(time);
            context.save();
            context.transform(transform.m11, transform.m12,
                              transform.m21, transform.m22,
                              transform.tx/transform.m11*xscale,
                              transform.ty/transform.m22*yscale);
            var grayout = timeOfPreviousThumb !== undefined && visual.tEndEdit < timeOfPreviousThumb;
            this.drawSelf(time, context, xscale, yscale, grayout, transformMatrix);
            context.restore();
        }
    }
    this.render = render;
};