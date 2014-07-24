var Pentimento_quiz = function(visual){
  $.extend(this, new Visual(visual));
  var audioM = $('audio')[0];
  var finished = false;
  var onscreen = false;
  
  function checkbounds(a,b){
    return !finished
  }
  this.checkbounds = checkbounds;
  
  
  var $quiz_question = $('<div>')
  $quiz_question.text(visual.question)
  
  var $quiz_body = $('<div>')
  if (visual.question_type == 'multiple_choice'){
    $.each(visual.choices, function(index, choice){
      var choice = $('<input type="radio" name = "'+ visual.question +'" value="' + choice +'">' + choice + '<br>')
      $quiz_body.append(choice)
    })
  }else if (visual.question_type == 'free_response'){
    var input = $('<input type = "text" name "'+ visual.question + '"> <br>')
    $quiz_body.append(input)
  }
  
  var $quiz_main = $('<div title = "Pop quiz!" >')
  var $submit_button = $('<button>Answer</button>')
  var $result_div = $('<div class = "result"></div>')
  
  
  $submit_button.click(function(e){
    
    if (visual.question_type == 'multiple_choice'){
      var ans = $quiz_body.find('input:checked').val()
    } else if(visual.question_type = 'free_response'){
      var ans = $quiz_body.find('input').val()
    }
    
    
    $submit_button.hide()
    $quiz_body.find('input').attr('disabled', 'true');
    
    //this should be done on the server to beat clever hackers
    if (ans == visual.answer){
      $result_div.html('<i class="fa fa-check fa-3x"></i> Correct! </div> ')
      $finish_button.show();
    }else{
      $result_div.html('<i class="fa fa-times fa-3x"></i> Incorrect Answer. </div> ')
      $Retry_button.show();
      $Reveal_button.show();
      $Rewind_button.show();
    }
  })
  
  var $finish_button = $('<button>Move On</button>')
  $finish_button.click(function(e){
    finished = true;
    $quiz_main.dialog("close");
    audioM.play();
    quiz_active = false;
  })
  
  var $Retry_button = $('<button>Retry</button>')
  $Retry_button.click(function(e){
    $quiz_main.find('button').hide()
    $result_div.html('')
    $quiz_body.find('input').attr('disabled',false)
    $submit_button.show();
  })
  
  var $Reveal_button = $('<button>Reveal Answer</button>')
  $Reveal_button.click(function(e){
    $quiz_main.find('button').hide()
    $result_div.html('the correct answer is '+ visual.answer)
    $finish_button.show();
  })
  var $Rewind_button = $('<button>Rewind</button>')
  $Rewind_button.click(function(e){
    $Rewind_button.hide();
    $Retry_button.click();
    $quiz_main.dialog("close");
    audioM.currentTime = visualToAudio(lecture, visual.rewindtime);
    audioM.play();
    quiz_active = false;
    })
  $quiz_body.append($submit_button)
  $quiz_main.append($quiz_question)
  $quiz_main.append($quiz_body)
  $quiz_main.append($result_div)
  $quiz_main.append($Retry_button)
  $quiz_main.append($Rewind_button)
  $quiz_main.append($Reveal_button)
  $quiz_main.append($finish_button)
  $Retry_button.hide();
  $finish_button.hide();
  $Reveal_button.hide();
  $Rewind_button.hide();
  
  this.drawSelf = function(time, context){
    if(time < visual.tMax && context.canvas.id == 'main_canvas'){
      if(!finished){
        $quiz_main.dialog({
          resizable: false,
          height: 270,
          width: 350,
          dialogClass: 'no-close'
        });
        audioM.pause();
        onscreen = true;
        quiz_active = true;
      }
    }
  }
}