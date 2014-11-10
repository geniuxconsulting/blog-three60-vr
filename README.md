360 video viewing with the Oculus Rift inside a browser
------------------------------------------------------

As you might have known already VR is getting closer and closer to being an
everyday household device that the common man has access to. In the last few
years we've seen amazing advances in this direction and you as well might
already have tried out the [Oculus Rift](http://www.oculus.com/).

Moreover not only the hardware got more accessible but also more and
more software creators are getting into the business of Virtual Reality. As
most of the times game developers are the early pioneers, and there are
already 500+ games that support the Oculus Rift, letting people emerge in the
 virtual world of these games.

Earlier this year we have attended the [push](http://push-conference.com/)
ux conference, where we've found out that the browsers are also experimenting
 with the idea of VR, and not only experimenting, but Firefox and Google
 Chrome both released a special build of our beloved browsers that support
 the Oculus Rift.

As [Josh Carpenter](http://voicesofvr
.com/81-josh-carpenter-on-webvr-to-combine-the-best-of-the-web-with-vr-vr
-experiments-from-mozilla-including-collaborative-web-browsing-with
-togetherjs/) outlined it, some people consider as VR will be the next
platform of delivering digital content in an exciting new way and they are
testing out user interaction concepts how this in would work out in practice.
 At this point we got also interested, and wanted to play around a bit just to
  see what the browser guys are up to. Therefore we thought about upgrading
  our earlier blog-project with the 360 video viewer to add Oculus Rift
  support to it.


To try it out
=============

### Prerequisites

As of now vr-enabled browsers only support the Oculus Rift, though we were told
that support for other device is on the way.

With this in mind, you can only test-drive the experiment with the Oculus
Rift that you've [properly installed](https://support.oculus
.com/hc/en-us/articles/202741283-Getting-Started-with-your-new-Oculus-Rift
-Development-Kit-2) on your machine.

### Steps to get it up and runnning

1. First you'll have to get yourself one of the vr-enabled browsers.
   Please download either:
    * [Firefox](http://blog.bitops
    .com/blog/2014/08/20/updated-firefox-vr-builds/)
      or
    * [Chrome](http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html)
1. Make sure your Rift is connected
1. Start the browser and navigate to [geniuxconsulting.github
.io/blog-three60-vr](geniuxconsulting.github.io/blog-three60-vr)
1. On some OSes you might have to move the window on the Oculus screen, and
then simply make it fullscreen by pressing `F11`
1. The video should be running inside the headset, with you being able to
look around in it.

### Controls

The sample application has 4 included videos that you can toggle by pressing
the keys `1` through `4`.

Use the mouse to drag around the view around to adjust the position of the
initial view.


Technical background
====================

So how does this essentially work? What does the VR support in the browser mean?

Basically displaying VR content has two main parts

* Displaying slightly different images for the two eyes,
* Reacting to user movement




