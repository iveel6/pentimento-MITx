var Pdf_Wrapper = function(visual, resourcepath){
    $.extend(this, new Visual(visual));
    var pdf_src = resourcepath+visual.fileName;
    var pagen = visual.page;
    var page = null;
    var view = null;
    var viewport = null;
    var textcontent = null;
    var initialized = false;      //pdf reading page
    var rendered = false;         //page ready on canvasR
    var transforming = false;     //a zoom is in process.
    var frames_of_constant_scale = 0  
    var oldscale = 1.0;           //old m11 value.
    var canvasM = $('#main_canvas')[0]
    var canvasR = $('<canvas/>')[0]
    var contextR = canvasR.getContext('2d')
    var canvasC = $('<canvas/>')[0]
    var contextC = canvasC.getContext('2d')
    var textDiv = $('<div>')[0]
    
    PDFJS.getDocument(pdf_src).then(function(pdf) {
        // Using promise to fetch the page
          pdf.getPage(pagen).then(function(p) {
            view = p.view;
            page = p;
            initialized = true;
            viewport = page.getViewport(1.0)
            canvasR.width = viewport.width
            canvasR.height = viewport.height
            var renderContext = {
              canvasContext: contextR,
              viewport: viewport
            };
            page.render(renderContext).promise.then(function(){
              rendered = true;
              recache();
            });
          });
    });
    function recache(){
      if(initialized && rendered){
        canvasC.width = canvasR.width
        canvasC.height = canvasR.height
        contextC.drawImage(canvasR,0,0);
      }
    }
    
    function rerender(scale){
      if(rendered&&initialized){
        rendered = false;
        viewport = page.getViewport(scale)
        canvasR.width = viewport.width
        canvasR.height = viewport.height
        var renderContext = {
            canvasContext: contextR,
            viewport: viewport
          };
        page.render(renderContext).promise.then(function(){
          rendered = true; 
          recache();});
      }
    }
  
    function checkbounds(a,b){
      return true
    }
    this.checkbounds = checkbounds;
    //not used.
    function rendertext(viewport){
        var textLayer = new TextLayerBuilder({
              textLayerDiv: textdiv,
              viewport: viewport,
              pageIndex: 0
            });
        textLayer.setTextContent(textContent);
    }
      
    //matrix: is to keep track of whether a rescale have happened, and hence 
    //a rerender is necessary.
    this.drawSelf = function (time, context, xscale, yscale,greyout, transformMatrix) {
        var x = visual.x*xscale;
        var y = visual.y*yscale;
        var w = visual.w*xscale;
        var h = visual.h*yscale;
        if(!visual.doesItGetDeleted || time < visual.tDeletion && context.canvas.id == 'main_canvas'){
              context.drawImage(canvasC,x,y,w,h)
            //option A. rerender every time the scale changes. higher quality, low proformance.
       //     if (transformMatrix.m11 != oldscale){
      //        oldscale = transformMatrix.m11
      //        rerender(2*transformMatrix.m11)
      //      }

            //option B. rerender every time the scale has finished changing. this has lower quality and higher proformance.
            if (transformMatrix.m11 == oldscale){
              frames_of_constant_scale += 1;
            }
            if (transformMatrix.m11 != oldscale){
              oldscale = transformMatrix.m11;
              frames_of_constant_scale = 0;
              transforming = true
            }
            if (transforming && frames_of_constant_scale > 2){
              transforming = false;
              rerender(2*transformMatrix.m11)   //2 results in clearer images than 1.
            }
    }
    }
}
//this is a bit inefficient way to deal with slides. However, there aren't that many slides. 
var Slide_Wrapper = function (height, width, resourcepath){
  var tempvisual = { 
                    "type" : "none",
                    "tMin":0,
                    "doesItGetDeleted" : false,
                    "tDeletion":0,
                    "hyperlink": "",
                    "transforms" : [
                        {
                          "time" : 0,
                          "m11" : 1.000000, "m12" : 0.000000, "m21" : 0.000000, "m22" : 1.000000, 
                          "tx" : 0.000000, "ty" : 0.000000
                        } ]
  }
  $.extend(this, new Visual(tempvisual));
  var pdf_src = resourcepath+'slides.pdf';
  var slides = [];
  var self = this;
  var loaded = false;
  var ready = false;
  var loading = false;
  var numPages = 0;
  function checkbounds(a,b){
      return true
  }
  
  function getWrapped(){
    return true
  }
  
  this.checkbounds = checkbounds;
  PDFJS.getDocument(pdf_src).then(function(pdf) {
    numPages = pdf.numPages;
    console.log(pdf.numPages)
    for (var i=0; i<numPages; i++){
      slides[i] = {   "type" : "pdf",
                      'page': i+1,
                      "tMin":0.0,
                      "tEndEdit":10.0,
                      "doesItGetDeleted" : false,
                      "tDeletion":0.0,
                      "hyperlink": "",
                      "transforms" : [
                          {
                            "time" : 0.0,
                            "m11" : 1.000000, "m12" : 0.000000, "m21" : 0.000000, "m22" : 1.000000, 
                            "tx" : 0.000000, "ty" : 0.000000
                          } ],
                        "x" : 0,   "y" : height*1.3*i,//magic 1.3
                        "w" : width,   "h" : height,
                        "fileName" : "slides.pdf" }
    }
    //I can't do slides[i] = new pdf_wrapper here. the code will NOT exececute, but instead fail silently.
    //So I have to do this thing to deal with the async problem.
    loaded = true;
  });
  this.drawSelf = function(time, context, xscale, yscale,greyout, transformMatrix){
    if(ready){
      slides.forEach(function(ele){
      ele.drawSelf(time,context,xscale,yscale,greyout,transformMatrix);
      })
    }else if(loaded){
        for (var i=0; i<numPages; i++){
          slides[i] = new Pdf_Wrapper(slides[i],resourcepath)
        }
        ready = true;
    }
  };
  
}
    
