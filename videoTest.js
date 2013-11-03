var PentimentoPlayer = function(data) {
    var controls = $('.controls');
    var fullscreenMode = false;
    var embedded = false;
    var root = $('.pentimento');
    var canvas_container = $('.canvas_container');
    var canvas = $('.video')[0];
    var xmax = data.width;
    var ymax = data.height;
    var audio = root.find('.audio')[0];
    var furthestpoint = 0;
    var currentTime = 0;
    
    var renderer;
    function eventHandler(info) {
        if(info.event === 'select') {
            console.log(info.data);
            if(info.data !== -1) {
                if(info.data.hyperlink !== '')
                    window.open(info.data.hyperlink);
                else {
                    currentTime = info.data.tMin;
                    audio.currentTime = currentTime;
                    changeSlider(currentTime);
                    if(audio.paused) { // draw the frame
                        renderer.renderFrame(currentTime);
                    }
                }
            }
        }
        else {
            info.data.time = currentTime;
            info.data.paused = audio.paused;
            renderer.fire(info);
        }
    }
    var listener;
    var draw;
    var initialPause;
    var endTime = data.durationInSeconds;
    
    /*************************
    *
    *   playback function -
    *   updates progress bar, canvas, and indicators
    *   
    *************************/
    function graphData(){
		currentTime=audio.currentTime;
		changeSlider(currentTime);
        renderer.renderFrame(currentTime);
        draw = window.requestAnimationFrame(graphData);
	}
    
    /*************************
    *
    *   begins visual playback
    *
    *************************/
    function start(){
        root.find('.start').css('background-image',
            "url('images/pause.png')");
        $('#slider .ui-slider-handle').css('background','#0b0');
        root.find('.video').css('border','1px solid #eee');
        
        $('#pauseIcon').attr("src",'images/play.png');
        fadeSign('images/pause.png');
        
        window.cancelAnimationFrame(draw);
        draw = window.requestAnimationFrame(graphData);
    }
    
    /*************************
    *
    *   pauses visual playback
    *
    *************************/
    function pause(){
        $('#timeStampURL').attr("disabled",false);
        $('#screenshotURL').attr("disabled",false);
        root.find('.start').css('background-image',
            "url('images/play.png')");
        $('#slider .ui-slider-handle').css('background','#f55');
        root.find('.video').css('border','1px solid #f88');
        
        $('#pauseIcon').attr("src",'images/pause.png');
        fadeSign('images/play.png');
        
        window.cancelAnimationFrame(draw);
        
        renderer.renderFrame(audio.currentTime);
    }
    
    /*************************
    *
    *   stops visual playback, resets furthestpoint and localstorage
    *
    *************************/
    function stop(){
        window.cancelAnimationFrame(draw);
        
        root.find('.start').css('background-image',
            "url('images/play.png')");
        $('#slider .ui-slider-handle').css('background','#f55');
        root.find('.video').css('border','1px solid #f88');
        
        furthestpoint=0;
    }
    
    /*************************
    *
    *   animates onscreen play/pause indicator
    *
    *************************/
    function fadeSign(nextImg){
        $('.onScreenStatus').stop();
        $('.onScreenStatus').css('visibility',"visible");
        $('.onScreenStatus').css('opacity',".5");
        $('.onScreenStatus').animate({
            opacity: 0
        },750,function(){ //function that executes once the animation finishes
            $('.onScreenStatus').css('visibility',"hidden");
            $('.onScreenStatus').css('opacity',".5");
            $('#pauseIcon').attr('src',nextImg);
        });
    }
    
    /*************************
    *
    *   updates progress slider as video plays
    *   updates furthestpoint
    *************************/
    function changeSlider(current){
        if (current<=endTime){ 
            //updates progress bar
            $('#slider').slider('value',current);
            
            //update furthest time bar
            if (current > furthestpoint) {
                furthestpoint=current;
                var percentage = (furthestpoint)/endTime * 100;
                $('.tick').css('width',percentage+'%');
            }
            
            //updates time display
            var secondsPassed=parseFloat(current);
            root.find('.time').html(secondsToTimestamp(secondsPassed));
            root.find('#totalTime').html(secondsToTimestamp(secondsPassed)+" / ");
            root.find('#totalTime').append(secondsToTimestamp(endTime));
            
            //updates listener
            listener.update({
                event: 'playback',
                time: current,
                transformMatrix: renderer.transformMatrix()
            });
        }
    }
    
    /*************************
    *
    *   translates seconds into minutes:seconds
    *   returns string
    *************************/
    function secondsToTimestamp(totalseconds){
        var minutes=Math.floor(totalseconds/60);
        var seconds=Math.round(totalseconds - minutes * 60);
        var zeros='';
        if (seconds < 10) zeros='0'; //adds zero for stuff like 01, 02 , etc
        return minutes +":"+zeros+seconds;
    }
    
    /*************************
    *
    *   triggered on scrubbing
    *   sets player to scrubbed time
    *************************/
    function sliderTime(){
        var val=$('#slider').slider('value');
        currentTime=val;
        renderer.renderFrame(currentTime);
        changeSlider(val);
    }
    
    /*************************
    *
    *   triggered when done scrubbing
    *   returns to playing if was playing
    *************************/
    function sliderStop(event, ui){
        audio.currentTime=ui.value;
        if (initialPause){ //if it was paused, don't do anything
            return;
        }
        if (ui.value == endTime){ //if scrubbed to end
            stop();
            return;
        }
        audio.play();
    }
    
    /*************************
    *
    *   triggered when starting to scrub
    *   temporarily pauses lecture
    *************************/
    function sliderStart(event, ui){
        initialPause=audio.paused;
        audio.pause();
    }
    
    /*************************
    *
    *   resizes playback controls
    *
    *************************/
    function resizeControls(vidWidth){
        if(fullscreenMode)
            vidWidth = $(window).width();
        controls.css('width', vidWidth);
        
        //set the control buttons
        var bigButtonWidths=Math.round(vidWidth* 50 / 575);
        var smallButtonWidths=Math.round(vidWidth* 30/575);
        if (bigButtonWidths > 50 ) { //sets large button size max at 50
            bigButtonWidths=50;
            smallButtonWidths=30;
        }
        var totalButtonWidth=bigButtonWidths+smallButtonWidths*2+15;
        $('.buttons').css('width', totalButtonWidth);
        $('.start').css('width',bigButtonWidths);
        $('.start').css('background-size',bigButtonWidths);
        $('.buttons button').css('width',smallButtonWidths);
        $('.buttons button').css('height',smallButtonWidths);
        $('.buttons button').css('background-size',smallButtonWidths-4);
        $('.buttons button').css('margin-top',smallButtonWidths/2-2);
        $('.speedUp').css('margin-left',smallButtonWidths+4);
        $('.help').css('width',bigButtonWidths);
        $('.help').css('height',bigButtonWidths);
        $('.help').css('margin-top','3px');
        $('.help').css('background-size',bigButtonWidths);
        $('.help').css('left',vidWidth-bigButtonWidths);
        
        //set volume button and slider
        var volWidth= vidWidth * 30/575;
        if (volWidth > 30) volWidth=30; //max size of vol button is 30
        $('.volume').css('width',volWidth);
        $('.volume').css('height',volWidth);
        $('.volume').css('background-size',volWidth);
        $('.volume').css('margin-top',bigButtonWidths/2 - volWidth/2+3);
        $('.volumeSlider').position({
            my: 'left center',
            at: 'right+10 center',
            of: $('.volume'),
        });
        var volSliderWidth=vidWidth * 50/575
        if (volSliderWidth>100) volSliderWidth=100; //max size of slider is 100
        if (volSliderWidth<30) volSliderWidth=30; //min size of slider is 30
        $('.volumeSlider').css('width',volSliderWidth);
        
        //sets video slider and timestamps
        var timeControlWidth=Math.round(vidWidth)-totalButtonWidth-volWidth-5;
        $('.timeControls').css('width',timeControlWidth);
        $('.timeControls').css('margin-left',totalButtonWidth);
        $('#slider').css('width',vidWidth);
        $('#totalTime').css('margin-top',bigButtonWidths/2-5);
        
        //sets the drag toggle controls and the current URL button
        var fontSize='';
        var urlText="current URL";
        if (vidWidth < 500) { //shrink font size if the canvas is too small
            fontSize='10px';
            urlText="URL";
        }
        $('.toggleControls').css('font-size',fontSize);
        $('.toggleControls').css('margin-top',bigButtonWidths/2-10);
        
//        displayZoom(totalZoom);
//        
//        clearFrame();
//        oneFrame(audio.currentTime);
    }
    
    /*************************
    *
    *   styles playback speed indicators
    *
    *************************/
    function speedIndicators(){
        $('.speedDisplay').text(Math.round(audio.playbackRate/1*100)/100 +" x");
        if (audio.playbackRate>1){
            $('.speedUp').css('opacity','.7');
            $('.slowDown').css('opacity','');
        } else if (audio.playbackRate < 1){
            $('.slowDown').css('opacity','.7');
            $('.speedUp').css('opacity','');
        } else {
            $('.speedDisplay').text("");
            $('.slowDown').css('opacity','');
            $('.speedUp').css('opacity','');
        }
    }
    
    /*************************
    *
    *   resizes player components depending on mode
    *
    *************************/
    function resizeVisuals(){
        var windowWidth=$(window).width();
        var windowHeight=$(window).height();
        var videoDim;
        //fit canvas to window width
        if (windowWidth>(windowHeight+150)){//take smaller of the two
            //add 150 to get correct aspect ratio
            videoDim=(windowHeight-200); //200 allows for bottom controls
            if (videoDim< parseInt(400 * ymax/xmax)) { //min width of video is 400
                videoDim=parseInt(400* ymax/xmax);
            }
            var scaleFactor=ymax; //using height to scale
        }
        else {
            videoDim=windowWidth-185; //185 allows for side controls
            if (videoDim<400) videoDim=400; //min width of video is 400
            var scaleFactor=xmax; //using width to scale
        }
        
        if(fullscreenMode | embedded) { // take up all available space
            $('body').css('padding',0);
            root.find('.menulink').hide();
            root.find('.pentimentoDialog').hide();
            if(fullscreenMode) {
                canvas.height = windowHeight;
                canvas.width = xmax/ymax*canvas.height;
                if(canvas.width > windowWidth) {
                    canvas.width = windowWidth;
                    canvas.height = ymax/xmax*canvas.width;
                }
            }
            else {
                canvas.height = windowHeight-controls.outerHeight(true);
                canvas.width = xmax/ymax*canvas.height;
            }
            $('.lecture').css({height: canvas.height,
                               width: canvas.width,margin: embedded?0:'auto auto'});
            controls.css({position: 'absolute',
                                top: ((windowHeight-controls.outerHeight(true))+'px'),
                                left: 0,
                                'background-color':fullscreenMode?'rgba(245,245,245,0.9)':''});
        }
        else {
            $('body').css('padding','');
            root.find('.menulink').show();
            root.find('.pentimentoDialog').show();
            canvas.height=ymax * videoDim/scaleFactor;
            canvas.width=xmax * videoDim/scaleFactor;
            $('.lecture').css({height: 'auto',
                               width: 'auto'});
            controls.css({position: 'absolute',
                                top: (($('.video').offset().top+
                                       $('.video').height()+10)+'px'),
                                left: ($('.video').offset().left+'px'),
                                'background-color':''});
            $('.sideButtons').css('opacity',1);
            $('.pentimentoDialog').css('left',canvas.width-$('.pentimentoDialog').width()-$('.menulink').width());
        }
        canvas_container.css({
            height: canvas.height,
            width: canvas.width
        });
        
        $('.captions').css('width',canvas.width);
        $('.captions').css('top',$('.controls').offset().top - 50 + 'px');
        $('.speedDisplay').css('top', -45 + 'px');
        var fontsize = canvas.width * 30/575;
        if (fontsize > 30 ) fontsize=30; //max font size 30
        $('.speedDisplay').css('font-size', fontsize+'px');
        
        renderer.fire({event: 'resize'});
        renderer.renderFrame(audio.currentTime);
        listener.update({event: 'resize'});
        offset = root.find('.video').offset();
        resizeControls(canvas.width);
        
        var onScreenStatusWidth=canvas.width * 80/575;
        $('.onScreenStatus').css('margin-top', -canvas.height/2-onScreenStatusWidth/2);
        $('.onScreenStatus').css('margin-left',canvas.width/2-onScreenStatusWidth/2);
        $('#pauseIcon').css('width',onScreenStatusWidth+"px");
        $('#pauseIcon').css('height',onScreenStatusWidth+"px");
        $('.onScreenStatus').css('opacity',".5");
        $('.onScreenStatus').css('visibility',"hidden");
        
        var sideIncrement = fullscreenMode?canvas.height/7:canvas.height/6;
        if(sideIncrement*2 > windowWidth-canvas.width)
            $('.lecture').css('margin',0);
        var transBtnDim = sideIncrement/2;
        $('.sideButtons').css({top: (offset.top),
                               left: (fullscreenMode?windowWidth-sideIncrement-2:offset.left+canvas.width+(embedded?0:10)),
                               height: (transBtnDim*7),
                               width:sideIncrement,
                               'border-radius':transBtnDim,
                               background:'rgba(235,235,235,'+(fullscreenMode?'0.1':'0.3')+')'});
        $('.transBtns').css({height:transBtnDim,
                             width:transBtnDim,
                             margin:transBtnDim/2,
                             'margin-bottom':0});
        $('#zoomOut').css('margin-bottom',transBtnDim);
        $('.URLinfo').css({left: parseInt($('#timeStampURL').position().left,10) - parseInt($('.URLinfo').css('width'),10),
                           top: parseInt($('#timeStampURL').position().top,10),
                           'border-right-width': transBtnDim+20,height:sideIncrement});
    }
    
    function initialize() {
        
        audio.volume=.5; //initial volume
        $('.volumeSlider').slider({
            max:1,
            min:0,
            step:0.1,
            value:audio.volume,
            range: "min",
            slide: function(event, ui){
                audio.volume=ui.value;
            }
        });
        $('.volume').on('click',function(){
            if (audio.muted){ //it was muted, unmute it
                audio.muted=false;
                $('.volumeSlider').slider('enable');
                $('.volume').css('background-image','url("images/vol.png")');
            }else { //it wasn't muted, mute it
                audio.muted=true;
                $('.volumeSlider').slider('disable');
                $('.volume').css('background-image','url("images/mute.png")');
            }
        });
        
        $('#slider').slider({
            max:endTime,
            min:0,
            step:0.1,
            range: 'max',
            stop: sliderStop,
            start: sliderStart,
            slide: sliderTime,
            change: function(event,ui){
                if (event.originalEvent) {
                    audio.currentTime = ui.value;
                    renderer.renderFrame(ui.value);
//                    var next = getTransform(ui.value);
//                    var initFree = freePosition;
//                    freePosition = true;
//                    animateToPos(Date.now(), 500, translateX, translateY, totalZoom, next.tx, next.ty, next.m11, function() {
//                        freePosition = initFree;
//                    });
                }
            }
                    //only call if it was a user-induced change, not program-induced
        });
        $('#slider').find('.ui-slider-range').removeClass('ui-corner-all');
        
        // about modal dialog
        $('#description-dialog').dialog({
            autoOpen: false,
            modal: true
        });
        $('.ui-dialog-titlebar').hide();
        $('.help').on('click',function(){
            $('#description-dialog').dialog('open');
        });
        $('#closeDialog').on('click',function(){
            $('#description-dialog').dialog('close');
        });
        
        // play/pause button controls audio playback
        root.find('.start').on('click',function() {
            if(audio.paused) {
                audio.play();
            }
            else {
                audio.pause();
            }
        });
        // audio playback controls visual playback
        audio.addEventListener('play', start);
        audio.addEventListener('pause', pause);
        audio.addEventListener('ended', stop);
        //fast forward & slow down
        root.find('.speedUp').on('click', function() {
            if ( audio.playbackRate < 1 ){
                audio.playbackRate += .25;
                audio.defaultPlaybackRate += .25;
            } else if (audio.playbackRate < 5){
                audio.playbackRate += .5;
                audio.defaultPlaybackRate += .5;
            }
            speedIndicators();
        });
        root.find('.slowDown').on('click', function() {
            if (audio.playbackRate > 1){
                audio.playbackRate -= .5;
                audio.defaultPlaybackRate -= .5;
            } else if ( audio.playbackRate > 0){
                audio.playbackRate -= .25;
                audio.defaultPlaybackRate -= .25;
            }
            speedIndicators();
        });
        
        renderer = new PentimentoRenderer(canvas_container, data);
        listener = new PentimentoListener(canvas_container, data, eventHandler);
        
        resizeVisuals();
        
        $("#zoomIn").on('click', function() {
            eventHandler({event: 'zoomIn', data: {}});
        });
        $("#zoomOut").on('click', function() {
            eventHandler({event: 'zoomOut', data: {}});
        });
        $('#seeAll').on('click', function() {
            eventHandler({event: 'minZoom', data: {}});
        });
        $('#revertPos').on('click', function() {
            eventHandler({event: 'refocus', data: {}});
        });
        
        $(window).on('resize', resizeVisuals);
    }
    
    return {initialize: initialize};
};

$(document).ready(function() {
    preprocess(lecture, 1);
    
    var player = new PentimentoPlayer(lecture);
    player.initialize();
});