var Video = function (visual, resourcepath) {
    $.extend(this, new Visual(visual));
    var videoObj = $('<video>')[0];
    videoObj.src = resourcepath + visual.fileName;
    this.drawSelf = function (time, context, xscale, yscale) {
      if(!visual.doesItGetDeleted || time < visual.tDeletion){
        if(videoObj.duration){
          console.log('time',time)
          videoObj.currentTime = Math.min(time - visual.tMin, videoObj.duration);
          }
        var x = visual.x*xscale;
        var y = visual.y*yscale;
        var w = visual.w*xscale;
        var h = visual.h*yscale;
        //y -= h;
        context.drawImage(videoObj, x,y,w,h);
      }
    }
};