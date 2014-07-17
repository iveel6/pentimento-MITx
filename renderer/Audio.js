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
  audioM.addEventListener('play', function(e){
    if (shouldPlay()){
      setPlaytime()
      audioObj.play();
      console.log(audioObj.currentTime)
    }
  })
  audioM.addEventListener('pause', function(e){
    setPlaytime();
    audioObj.pause();
  })
  
  function shouldPlay(){
    return (audioM.currentTime > (info.offset)) && (audioM.currentTime < (info.offset + audioObj.duration)) && !audioM.paused
  }
  
  function setPlaytime(){
    audioObj.currentTime = audioM.currentTime - info.offset

  }
}