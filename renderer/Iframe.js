//Pentimento implentation of iframe
//Is wrapped like a visual object, but does not get drawn onto the canvas.
//Pentimento_iframe object syntax:
//{ 
//"type" : "iframe",
//"src": "https://rawgit.com/changt/Knapsnack/master/knapsnack.html",//string URL
//"tMin": float tMin,
//"tEndEdit":not supported,
//"doesItGetDeleted" : boolean,
//"tDeletion": float tDeletion,
//"hyperlink": not supported,
//"transforms" : [
//    {
//      "time" : 15.0,
//      "m11" : 1.000000, "m12" : 0.000000, "m21" : 0.000000, "m22" : 1.000000, 
//      "tx" : 0.000000, "ty" : 0.000000
//    } ],
//  "x" : int xpos,   "y" : int ypos,
//  "w" : int width,   "h" : int height}

var Pentimento_iframe = function(visual){
  $.extend(this, new Visual(visual));
  var iframe = $('<iframe>')[0]
  var $iframe = $(iframe)
  iframe.src = visual.src
  $(iframe).css('position','absolute')
  //iframe has z-index BELOW the main canvas to allow strokes to appear on top
  //main canvas now has no pointer events, allowing clicks to pass through.
  $(iframe).css('z-index','2')
  $(iframe).css('display', 'none')
  $('.canvas_container').append(iframe)
  $('#main_canvas').css('pointer-events','none')

  //always render iframe no matter where it is. 
  //it's not very expensive(native html element), and not doing this can cause iframe to appear when it shouldn't
  function checkbounds(a,b){
    return true
  }
  this.checkbounds = checkbounds;
  
  this.drawSelf = function (time, context, xscale, yscale,greyout, transformMatrix) {
    //Iframe is not drawn on thumb canvases.
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