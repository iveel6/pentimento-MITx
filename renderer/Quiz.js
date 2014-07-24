var Pentimento_quiz = function(visual){
	$.extend(this, new Visual(visual));
	var audioM = $('audio')[0];
	var finished = false;
	var onscreen = false;
	var NUMBERS = [0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
	var LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
 
  function checkbounds(a,b){
    return !finished
  }
  this.checkbounds = checkbounds;
  
  var $quiz_question = $('<div>')
  $quiz_question.text(visual.question)
  
  var $quiz_body = $('<div>')
  
  if (visual.question_type == 'multiple_choice'){
	  //for single correct answer
	  if (visual.answer.length == 1){
		$.each(visual.choices, function(index, choice){
			var choice = $('<input type="radio" name = "'+ visual.question +'" value="' + choice +'">' + choice + '<br>')
			$quiz_body.append(choice)
		})
	  //for multiple correct answers
	  }else{
		  $.each(visual.choices, function( index, choice){
			  var choice = $('<input type="Checkbox" name = "'+ visual.question +'" value="' + choice +'">' + choice + '<br>')
			  $quiz_body.append(choice)
		  })
	  }
  }else if (visual.question_type == 'free_response'){
    var input = $('<input type = "text" name ="'+ visual.question + '"> <br>')
    $quiz_body.append(input)
  }else if (visual.question_type == 'matching'){
	  var table = $('<table></table>');
	  var shuffled_order = NUMBERS.slice(0, visual.right_side.length); 
	  visual.answer = [];
	  //shuffle matchings
	  shuffled_order.sort(function() { return 0.5 - Math.random() }); 
	  console.log(shuffled_order)
	  for (var i=0;i<shuffled_order.length; i++){
		  var row = $('<tr><td><input type="text" style="width:20px"></td><td>'+(NUMBERS[i]+1)+'. '+ visual.left_side[i]+'</td><td>'+'&nbsp&nbsp&nbsp'+LETTERS[i]+'. '+visual.right_side[shuffled_order[i]]+'</td></tr>');
		  table.append(row);
		  visual.answer.push(LETTERS[shuffled_order.indexOf(NUMBERS[i])]);
		  
	  }
	  $quiz_body.append(table);
  }	  

  
  var $quiz_main = $('<div title = "Pop quiz!" >')
  var $submit_button = $('<button>Submit</button>')
  var $result_div = $('<div class = "result"></div>')
  
  
  $submit_button.click(function(e){
    
	if (visual.question_type == 'multiple_choice'){
	  var ans = $quiz_body.find('input:checked').map(function() {
		  return $(this).val();}).toArray().join(',');
	}else if(visual.question_type == 'free_response'){
	  var ans = $quiz_body.find('input').val()
	}else if(visual.question_type == 'matching'){
		 var ans = $quiz_body.find('input').map(function() {
		  return $(this).val().toLocaleLowerCase();}).toArray().join(',');

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
	$result_div.html('the correct answer is ')
	if (visual.question_type == 'matching'){
		for (var i=0; i < visual.answer.length; i++){
			$result_div.append((i+1)+'-'+visual.answer[i]+';')
		}
	}else{
		$result_div.html('the correct answer is '+ visual.answer)
	}
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
          height: 300,
          width: 400,
          dialogClass: 'no-close'
        });
        audioM.pause();
        onscreen = true;
        quiz_active = true;
      }
    }
  }
}