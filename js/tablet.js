/**
 *
 * Created by matyas on 11/7/14.
 */

'use strict';
var tablet = {};

(function() {
	var worldQuat = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
	var deviceOrientation = null;

	tablet.applyDeviceOrientation = function(camera) {
		if (!deviceOrientation) {
			return;
		}
		var rot = deviceOrientation.getScreenAdjustedQuaternion();
		console.log(deviceOrientation);
		//var rot = deviceOrientation.getFixedFrameQuaternion();
		var qrot = new THREE.Quaternion();
		qrot.set(rot.x, rot.y, rot.z, rot.w);
		//camera.setRotationFromQuaternion(qrot);
		camera.quaternion.multiplyQuaternions(worldQuat, qrot);
	};

	tablet.initDevOrientation = function() {
		if (navigator.platform.toLowerCase().indexOf('win') === 0) {
			return;
		}
		// Create a new FULLTILT Promise for e.g. *compass*-based deviceorientation
		// data
		var promise = new FULLTILT.getDeviceOrientation({'type': 'world'});
		// FULLTILT.DeviceOrientation instance placeholder
		//var deviceOrientation;

		promise
			.then(function(controller) {
				//rotateAroundWorldAxis(movieSphere, V_ROT_AX, 90 * deg2rad);
				// Store the returned FULLTILT.DeviceOrientation object
				deviceOrientation = controller;
			})
			.catch(function(message) {
				console.error(message);

				// Optionally set up fallback controls...
				// initManualControls();
			});
	};

})();

