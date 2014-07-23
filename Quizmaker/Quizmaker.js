$(function(){
  //prepare the MC and Ma answer field
  //done here to have less effort.
  var MC_row_num = 0

  for (var i = 0; i< 4; i++){
        var $MC_row = $('<tr><td>choice ' + (i+1) + '</td><td><input type = text class = "choice_input"></td></tr>');
        var $match_row = $('<tr><td><input type = text class = "ma_input"></td><td><input type = text class = "ma_input_matching"></td></tr>');
        $('#choices_table').append($MC_row);
        $('#matching_table').append($match_row);
        MC_row_num += 1;
      }
  
  $('input:radio').change(function(e){
    $('.answer_specific_type').hide();
    if (e.target.id == 'Q_MC'){
      $('#multiple_choice_answers').show();
    }else if (e.target.id == 'Q_FR'){
      $('#free_response_answers').show();
    }else if (e.target.id == 'Q_Ma'){
      $('#matching_answers').show();
    }
  })
  
  $('#MC_add').click(function(e){
    var $MC_row = $('<tr><td>choice ' + (MC_row_num + 1) + '</td><td><input type = text class = "choice_input"></td></tr>');
    $('#choices_table').append($MC_row);
    MC_row_num += 1
  })
  
  $('#MC_remove').click(function(e){
    e.preventDefault();
    MC_row_num -= 1;
    $('#choices_table tr:last').remove();
  })
  
  
  $('#Ma_add').click(function(e){
    var $match_row = $('<tr><td><input type = text class = "ma_input"></td><td><input type = text class = "ma_input_matching"></td></tr>');
    $('#matching_table').append($match_row);
  })
  
  $('#Ma_remove').click(function(e){
    console.log('executing')
    $('#matching_table tr:last').remove();
  })
  
  
});
