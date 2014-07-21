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
  }
  
  var $quiz_main = $('<div title = "Pop quiz!" >')
  var $submit_button = $('<button>Answer</button>')
  var $result_div = $('<div class = "result"></div>')
  
  $submit_button.click(function(e){
    
    if (visual.question_type == 'multiple_choice'){
      var ans = $quiz_body.find('input:checked').val()
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
    }
  })
  
  var $finish_button = $('<button>Move On</button>')
  $finish_button.click(function(e){
    finished = true;
    $quiz_main.dialog("close");
    audioM.play();
  })
  
  var $Retry_button = $('<button>Retry</button>')
  $Retry_button.click(function(e){
    $Retry_button.hide();
    $Reveal_button.hide();
    $quiz_main.find('.result').html('')
    $quiz_body.find('input').attr('disabled',false)
    $submit_button.show();
  })
  
  var $Reveal_button = $('<button>Reveal Answer</button>')
  $Reveal_button.click(function(e){
    $Retry_button.hide();
    $Reveal_button.hide();
    $result_div.html('the correct answer is '+ visual.answer)
    $finish_button.show();
  })
  $quiz_body.append($submit_button)
  $quiz_main.append($quiz_question)
  $quiz_main.append($quiz_body)
  $quiz_main.append($result_div)
  $quiz_main.append($Retry_button)
  $quiz_main.append($Reveal_button)
  $quiz_main.append($finish_button)
  $Retry_button.hide();
  $finish_button.hide();
  $Reveal_button.hide();
  
  this.drawSelf = function(time, context){
    if(time < visual.tMax && context.canvas.id == 'main_canvas'){
      if(!finished){
        $quiz_main.dialog();
        audioM.pause();
        onscreen = true;
      }
    }
  }
}