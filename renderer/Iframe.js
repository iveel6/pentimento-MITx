var Pentimento_iframe = function(visual){
  $.extend(this, new Visual(visual));
  var iframe = $('<iframe>')[0]
  var $iframe = $(iframe)
  iframe.src = visual.src
  $(iframe).css('position','absolute')
  $(iframe).css('z-index','2')
  $(iframe).css('display', 'none')
  $('.canvas_container').append(iframe)
  $('#main_canvas').css('pointer-events','none')

  function checkbounds(a,b){
    return true
  }
  this.checkbounds = checkbounds;
  
  this.drawSelf = function (time, context, xscale, yscale,greyout, transformMatrix) {
    //don't draw/adjust webpage on thumb canvas.
    if(context.canvas.id == 'main_canvas'){
      if(time > visual.tMin && (!visual.doesItGetDeleted || time < visual.tDeletion)){
        var x = visual.x*xscale*transformMatrix.m11 + transformMatrix.tx;
        var y = visual.y*yscale*transformMatrix.m22 + transformMatrix.ty;
        var w = visual.w*xscale*transformMatrix.m11;
        var h = visual.h*yscale*transformMatrix.m22;
        $iframe.css('left',x)
        $iframe.css('top',y)
        iframe.width = w
        iframe.height = h
        $iframe.css('display', '')
      }else{
        $iframe.css('display', 'none')
      }
    }
  }
  
  this.render = function(time, context, xscale, yscale, timeOfPreviousThumb, transformMatrix) {
    if(time>visual.tMin){
      this.drawSelf(time,context,xscale,yscale,null,transformMatrix)
    }else{
      $iframe.css('display','none')
    }
}
}