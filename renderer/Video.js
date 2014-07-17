var Pentimento_video = function (visual, resourcepath) {
    $.extend(this, new Visual(visual));
    var videoObj = $('<video>')[0];
    var audio = $('audio')[0] //this is the audio to sync up with.
    videoObj.src = resourcepath + visual.fileName;
      audio.addEventListener('pause',function(){
        videoObj.pause();})
      audio.addEventListener('play',function(){
        if(shouldPlay(audio.currentTime)){
          videoObj.play();}
        })
    videoObj.muted = true;
    if (visual.audioEnabled){
      videoObj.muted = false;
    }
  
    this.drawSelf = function (time, context, xscale, yscale) {
      if((!visual.doesItGetDeleted || time < visual.tDeletion) && time>visual.tMin){
        /*setting the videoObj.currentTime is SLOW like REALLY SLOW like 3FPS slow 
        so it is infeasible to draw the video frame at the exact time as specified by the drawself function
        for smooth display it is necessary for the browser to JUST PLAY THE VIDEO and copy the video on to the canvas
        this gets out of sync when the user jump around and is readjusted when that happens 
        for the same reasons video needs to be synced with the audio (real) timer instead of the stretched video time.
        syncing for playbackrate allows for smoother play when fast forwarding.
        */
        if(videoObj.duration){
            if(Math.abs(videoObj.currentTime - getTime(time))>1){
              videoObj.currentTime = getTime(time)
            }
            videoObj.playbackRate = audio.playbackRate
            videoObj.play();
            var x = visual.x*xscale;
            var y = visual.y*yscale;
            var w = visual.w*xscale;
            var h = visual.h*yscale;
            context.drawImage(videoObj, x,y,w,h);
          }
        }else{
          videoObj.pause();
        }
      }
  //returns the real time of the video.
  function getTime(time){
    return Math.min(visualToAudio(lecture, time) - visualToAudio(lecture,visual.tMin), videoObj.duration);
  }
  function shouldPlay(currentTime){
    return (currentTime > visualToAudio(lecture, visual.tMin)) && (currentTime > visualToAudio(lecture, visual.tMin) + videoObj.duration)
  }
}