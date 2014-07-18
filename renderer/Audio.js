var Pentimento_audio = function(info, resourcepath){
  console.log('running')
  var audioObj = $('<audio>')[0]
  audioObj.src = resourcepath + info.fileName
  var audioM = $('audio')[0]
  audioM.addEventListener('timeupdate', function(e){
    if (audioObj.paused && shouldPlay()){
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