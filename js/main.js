(function (context) {
    'use strict';
    var PAN_VELOCITY = 0.005;

    // hold previous touch  center. Important for calculating the delta movement values
    var prevCenter;
    var options;

    // hammer and normal event listeners
    var listeners = {
        hammer: {
            tap: function () {
                three60.zoom(1);
            },
            dragstart: function (e) {
                prevCenter = e.gesture.center;
            },
            drag: function (e) {
                var dx = e.gesture.center.pageX - prevCenter.pageX;
                var dy = e.gesture.center.pageY - prevCenter.pageY;
                prevCenter = e.gesture.center;

                three60.pan({
                    x: -dx * PAN_VELOCITY,
                    y: -dy * PAN_VELOCITY
                });
            }
        },
        click: function () {
            var video = three60.getVideo();
            if (video && video.paused) {
                video.play();
            }
        },
        mousewheel: function (e) {
            var chg = 1 + (e.originalEvent.deltaY < 0 ? 0.1 : -0.1);
            var newZoom = three60.getZoom() * chg;
            three60.zoom(newZoom);
        }
    };

    // assign initial listeners
    var initControls = function () {
        $(document).on('keyup', function (e) {
            console.log(e.which);
            if (e.which > 48 && e.which < 53) { // 1,2,3,4
                var vidId = e.which - 48;
                var video = three60.getVideo();
                video.src = './videos/test' + vidId + '.webm';
                video.load();
                video.play();
            }
            if (e.which === 86) { //v
                three60.toggleVRMode();
                var size = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                console.log(size);
                $(options.$target).css(size).attr(size);
                three60.resize(size);
            }
        });
        $.each(listeners.hammer, function (k, v) {
            $('#three60').hammer({
                'prevent_default': true
            }).on(k, v);
        });
        $('#three60')
            .on('mousewheel', listeners.mousewheel)
            .on('tap', listeners.click);
        $('.fullscreen.btn').on('click', function () {
            if (THREEx.FullScreen.activated()) {
                THREEx.FullScreen.cancel();
                $('.fullscreen.btn .up').show();
                $('.fullscreen.btn .down').hide();
            } else {
                THREEx.FullScreen.request();
                $('.fullscreen.btn .up').hide();
                $('.fullscreen.btn .down').show();
            }
        });
    };

    context.init = function (opts) {
        options = opts;
        $('.fullscreen.btn .down').hide();
        $(window).on('resize', function () {
            var size = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            console.log(size);
            $(opts.$target).css(size).attr(size);
            three60.resize(size);
        });
        three60.init({
            fov: 96,
            width: opts.$target.width(),
            height: opts.$target.height(),
            videoURL: opts.videoURL,
            target: opts.$target[0],
            callback: function () {
                initControls();
            }
        });
    };
})(window);
