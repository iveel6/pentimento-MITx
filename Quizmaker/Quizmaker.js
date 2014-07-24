$(function(){
  //prepare the MC and Ma answer field
  //done here to have less effort.
  var MC_row_num = 0
  
  function Create_MC_row(){
    var $MC_row = $('<tr><td><input type = radio name = "MC_Correct"></td><td><input type = text class = "MC_input"></td></tr>');
    return $MC_row
  }
  
  function Create_Match_row(){
    var $match_row = $('<tr><td><input type = text class = "ma_input"></td><td><input type = text class = "ma_input_matching"></td></tr>');
    return $match_row
  }
  
  function Create_MMC_row(){
    var $MMC_row = $('<tr><td><input type = checkbox name = "MMC_Correct"></td><td><input type = text class = "MMC_input"></td></tr>');
    return $MMC_row
  }

  for (var i = 0; i< 4; i++){
        $('#choices_table').append(Create_MC_row());
        $('#matching_table').append(Create_Match_row());
        $('#choices_table_2').append(Create_MMC_row());
        MC_row_num += 1;
      }
  
  $('input[name=question]:radio').change(function(e){
    $('.answer_specific_type').hide();
    if (e.target.id == 'Q_MC'){
      $('#multiple_choice_answers').show();
    }else if (e.target.id == 'Q_FR'){
      $('#free_response_answers').show();
    }else if (e.target.id == 'Q_Ma'){
      $('#matching_answers').show();
    }else if (e.target.id == 'Q_MMC'){
      $('#multiple_choice_answers_2').show();
    }
  })
  
  $('#MC_add').click(function(e){
    $('#choices_table').append(Create_MC_row());
    MC_row_num += 1
  })
  
  $('#MC_remove').click(function(e){
    e.preventDefault();
    MC_row_num -= 1;
    $('#choices_table tr:last').remove();
  })
  
  $('#MMC_add').click(function(e){
    $('#choices_table_2').append(Create_MMC_row());
  })
  
  $('#MMC_remove').click(function(e){
    $('#choices_table_2 tr:last').remove();
  })
  $('#Ma_add').click(function(e){
    $('#matching_table').append(Create_Match_row());
  })
  
  $('#Ma_remove').click(function(e){
    $('#matching_table tr:last').remove();
  })
  
  
  $('#generate').click(function(e){
    var quiz = {}
    quiz.question = $('#question_title').val();
    var question_type = $('input[name=question]:checked').data('type')
    quiz.type = 'quiz'
    quiz.question_type = question_type
    quiz.tMin = parseInt($('#Starttime').val()) || 0;
    quiz.tMax = parseInt($('#Endtime').val()) || 0;
    quiz.rewindtime = parseInt($('#Rewindtime').val()) || 0;
    quiz.transforms = [
    {
      "time" : 0.0,
      "m11" : 1.000000, "m12" : 0.000000, "m21" : 0.000000, "m22" : 1.000000, 
      "tx" : 0.000000, "ty" : 0.000000
    }]
    var choices = []
    var answer;
    switch(question_type){
        case 'multiple_choice':
          $('input.MC_input').each(function(index,ele){
            choices[index] = $(ele).val();
          });
          answer = [$('input[name="MC_Correct"]:checked').parent().next().children().val()]
          quiz.choices = choices;
          quiz.answer = answer;
          break;
        case 'free_response':
          answer = $('#fr_correct_ans').val();
          quiz.answer = answer;
          break;
        case 'multiple_choice_2':
          answer = []
          quiz.question_type = 'multiple_choice';
          $('input.MMC_input').each(function(index,ele){
            choices[index] = $(ele).val();
            if($(ele).parent().prev().children().prop('checked')){
              answer.push(choices[index])
            }
          })
          quiz.choices = choices;
          quiz.answer = answer;
          break;
        case 'matching':
          var left_side = [];
          var right_side = [];
          $('input.ma_input').each(function(index,ele){
            left_side[index] = $(ele).val();
          })
          $('input.ma_input_matching').each(function(index,ele){
            right_side[index] = $(ele).val();
          })
          quiz.left_side = left_side;
          quiz.right_side = right_side;
          break;
    }
    window.prompt('this is the quiz output. paste it into the .lec file to add it into the lecture!', JSON.stringify(quiz)+ ',')
  })
  
  
});
