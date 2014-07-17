var Pentimento_video = function (visual, resourcepath) {
    $.extend(this, new Visual(visual));
    var videoObj = $('<video>')[0];
    var audio = $('audio')[0] //this is the audio to sync up with.
    var desiredTime = 0;
    videoObj.src = resourcepath + visual.fileName;
    //syncs the video with the audio as much as possible.
    audio.addEventListener('pause',function(){
      videoObj.pause();})
    audio.addEventListener('play',function(){
      if(shouldPlay(audio.currentTime)){
        videoObj.play();}
      })
    audio.addEventListener('ratechange', function(e){
      videoObj.playbackRate = audioM.playbackRate;
    })

    videoObj.muted = !visual.audioEnabled;
    //syncs video with muting and volume adjustment.
    //let's only do it if audio is enabled, so that we get a little performance.
    if(visual.audioEnabled){
        audioM.addEventListener('volumechange', function(e){
        audioObj.volume = audioM.volume;
        $('.volume').on('click', function(e){
            videoObj.muted = !videoObj.muted
        })
      })
    }
    
    this.drawSelf = function (time, context, xscale, yscale) {
      if(shouldPlay(audio.currentTime) && context.canvas.id == 'main_canvas'){
        /*setting the videoObj.currentTime is SLOW like REALLY SLOW like 3FPS slow 
        so it is infeasible to draw the video frame at the exact time as specified by the drawself function
        for smooth display it is necessary for the browser to JUST PLAY THE VIDEO and copy the video on to the canvas
        this gets out of sync when the user jump around and is readjusted when that happens 
        for the same reasons video needs to be synced with the audio (real) timer instead of the stretched video time.
        syncing for playbackrate allows for smoother play when fast forwarding.
        desiredTime is also created to reduce this overhead.
        */
        if(videoObj.duration){
            setVideoTime();
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
  //the video should play if it's past the starttime, and before the endtime, if the video gets deleted.
  function shouldPlay(currentTime){
    return (currentTime > visual.starttime) && ((currentTime < visual.tDeletion) || !visual.doesItGetDeleted)
  }
  //only set the video's currenttime when it is needed.
  function setVideoTime(){
    desiredTime = audio.currentTime - visual.starttime
    if (visual.loop){
      desiredTime %= videoObj.duration
      videoObj.play();
    }else{
      if(videoObj.duration > desiredTime){
        videoObj.play();
      }else{
        desiredTime = videoObj.duration;
        videoObj.pause()
      }
    }
    if(Math.abs(videoObj.currentTime - desiredTime) > 1){
      videoObj.currentTime = desiredTime 
    }
  }
}