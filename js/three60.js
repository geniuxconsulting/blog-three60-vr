/**

 # three60 `public/js/three60.js`

 The module creates a controllable (pan / zoom) 3D video viewer.

 ## Methods

 ### *init(options)*

 Initializes the module, which consists of:
 * creating a WebGl-enabled canvas
 * loading the video
 * starting the rendering loop, that basically starts the player

 #### *options* is an object with the following properties

 * videoURL: the URL of the video to be loaded (must be in same domain or from
 CORS enabled server) `default:  undefined`
 * target: the target element where to put the canvas `default:  undefined`
 * fov: the horizontal FOV of a projection `default:  90.0`
 * minFOV: the minimum FOV (maximum zoom) > 0 `default:  30`
 * maxFOV: the maximum FOV angle (minimum zoom) < 180 `default:  120`
 * callback: called when initialization is complete `default:  loggingMethod`

 ### *pan(delta)*

 The method receives a delta object that specify how much panning should be
 applied and then it rotates the textured sphere accordingly

 * along the world's vertical axis (for panning left / right)
 * around its own horizontal (y) axis (for panning up / down)

 ### *zoom(zoom)*

 Simply changes the FOV of the camera and also makes sure that the values are
 capped unlike the pan method the zoom parameter here represents the absolute
 value and not the delta (change)
 returns true if zoom has been changed

 ### *getZoom()*

 Returns the current zoom value

 ### *getVideo()*

 Returns the video object to give the possibility of controlling it to external
 methods


 ## Dependencies

 The module depends on the following libraries, which can all be found in the
 `/public/js/lib` directory.

 * three.min.js
 * stats.js (threejs module)
 * detector.js (threejs module)


 # Working with the project

 This small project was made using [`meteorjs`](http://www.meteor.com) - because
 it needs a server to serve the video.

 Follow the steps below to try it out locally:

 * Install meteor by running: `curl https://install.meteor.com/ | sh`
 (Linux / OSX)
 * Clone the repo: `git clone git@github.com:geniuxconsulting/blog-three60.git`
 * `cd blog-three60`
 * run `meteor`

 */
(function(context) {
	'use strict';

	// near & far planes
	var NEAR = 10,
		FAR = 10000;

	var DEFAULT_OPTIONS = {
		// the height of the destination video output
		height: 0,
		// the width of the destination video output
		width: 0,
		// the URL of the video to be loaded (must be in same domain or from
		// CORS enabled server)
		videoURL: undefined,
		// the target element where to put the canvas
		target: undefined,
		// the horizontal FOV of a projection
		fov: 90.0,
		// the minimum FOV (maximum zoom) > 0
		minFOV: 30,
		// the maximum FOV angle (minimum zoom) < 180
		maxFOV: 120,
		// called when initialization is complete
		callback: function() {
			if (typeof console !== 'undefined') {
				console.log('three60 initialized');
			}
		}
	};

	// the options object (DEFAULT_OPTIONS merged with custom)
	var options;
	// howmany h & v tiles does the sphere have
	var SPHERE_QUALITY = 32;
	// the radius of the sphere
	var SPHERE_RADIUS = 1024;
	// the axis horizontal rotation are made around when panning
	var H_ROT_AX = new THREE.Vector3(0, 1, 0);
	// the axis vertical rotation are made around when panning
	var V_ROT_AX = new THREE.Vector3(0, 0, 1);

	// initialized flag
	var INITIALIZED = false;
	// threejs renderer element
	var renderer = null;
	// the video element that serves as the image source for the texture
	var video = null;
	var image = new Image();
	image.src = 'imgs/ship.png';
	// the 3d scene that contains the camera & sphere
	var scene = null;
	// the sphere on which the video will be projected
	var movieSphere = null;
	// the texture that is updated from the video, and mapped on the sphere
	var videoTexture = null;
	// the camera that will provide the output - the end video
	var camera;

	// the Stats object providing FPS information
	var stats = null;

	// simple implementation of $.extend / _.extend to cut dependency
	var extend = function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var o = arguments[i];
			for (var k in o) {
				if (o.hasOwnProperty(k)) {
					target[k] = o[k];
				}
			}
		}
		return target;
	};

	// Helper method, that rotates the given threejs object around the given axis
	var rotateAroundWorldAxis = function(object, axis, radians) {
		// http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
		var rotWorldMatrix = new THREE.Matrix4();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

		rotWorldMatrix.multiply(object.matrix);

		object.matrix = rotWorldMatrix;
		object.rotation.setFromRotationMatrix(object.matrix);
	};

	// sets the fov of the camera
	// returns true if fov has been changed
	var setFOV = function(fov) {
		var hfov = fov;
		var ASPECT = options.width / options.height;
		var toRad = Math.PI / 180.0;
		var toAng = 180.0 / Math.PI;
		var vfov = (2.0 * Math.atan(Math.tan(hfov * toRad / 2.0) / ASPECT)) * toAng;

		if (camera.fov !== vfov) {
			camera.fov = vfov;
			camera.updateProjectionMatrix();
			return true;
		}
	};

	// create and initialize the camera, by positioning it, specifying a lookAt
	// direction and setting its FOV
	var initCam = function() {
		var ASPECT = options.width / options.height;
		camera = new THREE.PerspectiveCamera(35, ASPECT, NEAR, FAR);
		camera.position.set(0, 0, 0);

		var deg = 0;
		deg *= Math.PI / 180;
		var lat = new THREE.Vector3(Math.cos(deg), 0, Math.sin(deg));
		camera.lookAt(lat);

		setFOV(options.fov);
	};

	// the method responsible for rendering the output of the player + it calls
	// the stat update method
	// It recursively reschedules itself for the next animation frame
	var refreshTexture = function refreshTexture() {
		if (video) {
			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				//alert('vid to texture');
				videoTexture.needsUpdate = true;
			} else if (video.readyState > 1 && window.waitingForFrame === 10) {
				//alert('no vid data for texture');
				video.load();
				video.currentTime = 0;
				video.play();
				window.waitingForFrame = 0;
			} else {
				if (video.readyState > 1) {
					window.waitingForFrame = (window.waitingForFrame || 0) + 1;
				}
			}
		}
		else if (!window.myFlag) {
			videoTexture.needsUpdate = true;
			window.myFlag = true;
		}
	};
	var render = function() {
		requestAnimationFrame(render);
		refreshTexture();
		if (vr.enabled) {
			vr.render();
		} else {
//			tablet.applyDeviceOrientation(camera);
			renderer.enableScissorTest(false);
			renderer.render(scene, camera);
		}
		if (typeof Stats !== 'undefined') {
			stats.update();
		}
	};

	// create and initialize the renderer (the WebGL canvas)
	var initRenderer = function() {
		if (Detector.webgl) {
			console.log('WebGL support');
			renderer = new THREE.WebGLRenderer({
				antialias: false
			});
		} else {
			console.log('No WebGL support');
			renderer = new THREE.CanvasRenderer();
			if (typeof console !== 'undefined') {
				console.log('No WebGL support');
			}
		}
		renderer.setSize(options.width, options.height);
		options.target.appendChild(renderer.domElement);
	};

	// init the stats object and add it to the dom
	var initStats = function() {
		if (typeof Stats !== 'undefined') {
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.bottom = '0px';
			stats.domElement.style.zIndex = 100;
			options.target.appendChild(stats.domElement);
		}
	};

	// load the video in a html5 video object, and notify the callback function
	// when it's ready
	var initVideo = function(loadedCallback) {
		video = document.createElement('video');
		//video.canPlayType('video/mp4');
		video.volume = 0;
		video.loop = true;
		video.src = options.videoURL;
		video.oncanplay = loadedCallback;
		video.load(); // must call after setting/changing source
		//setTimeout(loadedCallback, 1000);
	};

	// creates the texture object, assigning the video as its datasource
	var initTexture = function() {
		if (video) {
			videoTexture = new THREE.Texture(video);
		}
		else {
			videoTexture = new THREE.Texture(image);
		}
		// flipX
		// https://github.com/jeromeetienne/tquery/blob/master/plugins/webrtcio/olddemo/index.html
		videoTexture.repeat.set(-1, 1);
		videoTexture.offset.set(1, 0);
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
	};

	// creates the sphere, and assigns the created texture to it
	var initSphere = function() {
		initTexture();

		var movieMaterial = new THREE.MeshBasicMaterial({
			map: videoTexture,
			overdraw: true,
			blending: THREE.NoBlending,
			shading: THREE.NoShading,
			fog: false,
			side: THREE.BackSide
		});
		// the geometry on which the movie will be displayed;
		// 		movie image will be scaled to fit these dimensions.
		var movieGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, SPHERE_QUALITY,
			SPHERE_QUALITY);
		movieGeometry.dynamic = true;
		movieSphere = new THREE.Mesh(movieGeometry, movieMaterial);
		movieSphere.position.set(0, 0, 0);
	};

	// initializes the 3D scene: creates & positions the textured sphere and
	// the camera
	var initScene = function() {
		scene = new THREE.Scene();

		initSphere();
		scene.add(movieSphere);

		initCam();
		scene.add(camera);
	};

	// the method that is called when the texture video has finished loading.
	// It starts it, initializes the 3D scene and starts the rendering loop
	// At the end calls the callback parameter, to notify the intializer of the
	// completion of the process
	var afterVideoLoad = function() {
		//alert('vid loaded');

		if (video) {
			video.oncanplay = undefined;
			video.currentTime = 0;
			video.play();
			video.volume = 0;
		}

		initRenderer();

		initStats();

		initScene();

		INITIALIZED = true;
		vr.init(function() {
			render();
			options.callback();
//			tablet.initDevOrientation();
		});
	};

	// public method, that sets the options for the module and initializes video
	// loading. on load complete it commences the initialization of the rest of
	// the necessary items
	var init = function(opts) {
		options = extend({},
			DEFAULT_OPTIONS, {
				width: window.innerWidth,
				height: window.innerHeight
			},
			opts
		);
		//alert('load vid');
		if (navigator.platform.indexOf('armv') !== -1) {
			setTimeout(afterVideoLoad, 3000);
		}
		else {
			initVideo(afterVideoLoad);
		}
	};

	// declares the methods that are accessible to the public context
	context.three60 = {
		// makes the init method public
		init: init,
		// the method receives a delta object that specify how much panning should
		// be applied and then it rotates the textured sphere accordingly
		//   * along the world's vertical axis (for panning left / right)
		//   * around its own horizontal (y) axis (for panning up / down)
		pan: function(delta) {
			if (!INITIALIZED) {
				return;
			}
			var dy = delta.y;
			var dx = delta.x;

			rotateAroundWorldAxis(movieSphere, V_ROT_AX, dy);
			movieSphere.rotateOnAxis(H_ROT_AX, dx);
		},
		// simply changes the FOV of the camera and also makes sure that the values
		// are capped unlike the pan method the zoom parameter here represents the
		// absolute value and not the delta (change)
		// returns true if zoom has been changed
		zoom: function(zoom) {
			if (!INITIALIZED) {
				return;
			}
			options._hfov = options.fov / zoom;
			options._hfov = Math.max(options.minFOV,
				Math.min(options.maxFOV, options._hfov));
			return setFOV(options._hfov);
		},
		// get the current zoom value
		getZoom: function() {
			return options.fov / (options._hfov || options.fov);
		},
		// exposes the video object to give the possibility of control to external
		// methods
		getVideo: function() {
			return video;
		},
		toggleVRMode: function() {
			if (vr.available) {
				vr.enabled = !vr.enabled;
			}
		},
		// resizes the renderer output. The parameter object should have a width &
		// height property
		resize: function(size) {
			renderer.setSize(size.width, size.height);
			options.width = size.width;
			options.width = size.width;
			initCam();
		}
	};

})(window);
