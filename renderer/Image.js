var Image = function (visual, resourcepath) {
    $.extend(this, new Visual(visual));
    var imageObject = document.createElement('img');
    imageObject.src = resourcepath+visual.fileName;
    this.drawSelf = function (time, context, xscale, yscale) {
        var x = visual.x*xscale;
        var y = visual.y*yscale;
        var w = visual.w*xscale;
        var h = visual.h*yscale;
        y -= h;
        context.drawImage(imageObject, x, y, w, h);
    }
};