//Pentimento Audio Object
//NOT A VISUAL OBJECT - NOT RENDERED WITH VISUAL OBJECTS.
//Audio OBJ syntax: 
//'audios' is at root level, like 'visuals'
//"audios":  [{
//"type" : "m4a",//this is actrully not used
//"offset": int offset,//when it should start playing,in seconds, audio time.
//"doesItGetDeleted" : boolean,//this is actrully not supported. audio stops playing when it finises.
//"tDeletion":0,//not used
//"fileName" : "sample_audio3.m4a"//make sure your browser supports this format. }],

var Pentimento_audio = function(info, resourcepath){
  var audioObj = $('<audio>')[0]
  audioObj.src = resourcepath + info.fileName
  var audioM = $('audio')[0]  //main audio to sync up with.
  //event listeners to stay synced with the main audio.
  //as the case with video, time syncing cannot happen too frequently 
  //for the sake of performance.
  audioM.addEventListener('timeupdate', function(e){
    if (audioObj.paused && shouldPlay()){
      setPlaytime();
      audioObj.play()
    }
  })
  audioM.addEventListener('ratechange', function(e){
    audioObj.playbackRate = audioM.playbackRate;
  })
  
  audioM.addEventListener('volumechange', function(e){
    audioObj.volume = audioM.volume;
  })
  audioM.addEventListener('play', function(e){
    if (shouldPlay()){
      setPlaytime()
      audioObj.play();
    }
  })
  audioM.addEventListener('pause', function(e){
    //setPlaytime();
    audioObj.pause();
  })
  $('.volume').on('click', function(e){
    audioObj.muted = !audioObj.muted
  })
  function shouldPlay(){
    return (audioM.currentTime > (info.offset)) && (audioM.currentTime < (info.offset + audioObj.duration)) && !audioM.paused
  }
  
  function setPlaytime(){
    audioObj.currentTime = audioM.currentTime - info.offset
  }
}