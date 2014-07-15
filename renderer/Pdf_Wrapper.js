var Pdf_Wrapper = function(visual, resourcepath){
    $.extend(this, new Visual(visual));
    var pdf_src = resourcepath+visual.fileName;
    var pagen = visual.page;
    var page = null;
    var view = null;
    var initialized = false;      //pdf reading page
    var loaded = false;           //page has been rendered
    var rendered = false;         
    var cached = false;
    var canvasM = $('#main_canvas')[0]
    var canvasR = $('<canvas/>')[0]
    var contextR = canvasR.getContext('2d')
    var canvasC = $('<canvas/>')[0]
    var contextC = canvasC.getContext('2d')
    PDFJS.getDocument(pdf_src).then(function(pdf) {
        // Using promise to fetch the page
          pdf.getPage(pagen).then(function(p) {
          view = p.view;
          page = p;
          initialized = true;
          canvasR.width = canvasM.width - 50;
          canvasR.height = canvasM.height - 50;
          var viewport = new PDFJS.PageViewport(page.view, 2.0, 0, 0, 0, true);
          var renderContext = {
            canvasContext: contextR,
            viewport: viewport
          };
          viewport.transform = [1,0,0,-1,0,750]
          console.log(renderContext);
          page.render(renderContext);
          rendered = true;
          });
        });
  
    function recache(){
      if(initialized){
        canvasC.width = canvasM.width - 50;
        canvasC.height = canvasM.height - 50;
        contextC.drawImage(canvasR,0,0);
      }
    }
    this.drawSelf = function (time, context, xscale, yscale) {
        var x = visual.x*xscale;
        var y = visual.y*yscale;
        var w = visual.w*xscale;
        var h = visual.h*yscale;
        console.log(w,h)
        //y -= h;
        if(rendered && initialized){
          context.drawImage(canvasR,x,y,w,h)
        }
        recache();
    }
}
    

