/**
 * Created by matyas on 11/7/14.
 */
'use strict';
var vr = {};

(function() {
	var renderTargetWidth = 1920;
	var renderTargetHeight = 1080;
	var NEAR = 10,
		FAR = 10000;

	var cameraLeft =
		new THREE.PerspectiveCamera(55, 4 / 3, NEAR, FAR);
	var cameraRight =
		new THREE.PerspectiveCamera(55, 4 / 3, NEAR, FAR);
	var sensorDevice = null;
	var hmdDevice = null;
	vr.enabled = false;
	var fovScale = 1.0;

	function resize() {
		//if (vrMode) {
		//    camera.aspect = renderTargetWidth / renderTargetHeight;
		//    camera.updateProjectionMatrix();
		//    renderer.setSize(renderTargetWidth, renderTargetHeight);
		//} else {
		//    camera.aspect = window.innerWidth / window.innerHeight;
		//    camera.updateProjectionMatrix();
		//    renderer.setSize(window.innerWidth, window.innerHeight);
		//}
	}

	function perspectiveMatrixFromVRFieldOfView(fov, zNear, zFar) {
		var outMat = new THREE.Matrix4();
		var out = outMat.elements;
		var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
		var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
		var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
		var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);

		var xScale = 2.0 / (leftTan + rightTan);
		var yScale = 2.0 / (upTan + downTan);

		out[0] = xScale;
		out[4] = 0.0;
		out[8] = -((leftTan - rightTan) * xScale * 0.5);
		out[12] = 0.0;

		out[1] = 0.0;
		out[5] = yScale;
		out[9] = ((upTan - downTan) * yScale * 0.5);
		out[13] = 0.0;

		out[2] = 0.0;
		out[6] = 0.0;
		out[10] = zFar / (zNear - zFar);
		out[14] = (zFar * zNear) / (zNear - zFar);

		out[3] = 0.0;
		out[7] = 0.0;
		out[11] = -1.0;
		out[15] = 0.0;

		return outMat;
	}

	function resizeFOV(amount) {
		var fovLeft, fovRight;

		if (!hmdDevice) {
			return;
		}

		if (amount !== 0 && 'setFieldOfView' in hmdDevice) {
			fovScale += amount;
			if (fovScale < 0.1) {
				fovScale = 0.1;
			}

			fovLeft = hmdDevice.getRecommendedEyeFieldOfView('left');
			fovRight = hmdDevice.getRecommendedEyeFieldOfView('right');

			fovLeft.upDegrees *= fovScale;
			fovLeft.downDegrees *= fovScale;
			fovLeft.leftDegrees *= fovScale;
			fovLeft.rightDegrees *= fovScale;

			fovRight.upDegrees *= fovScale;
			fovRight.downDegrees *= fovScale;
			fovRight.leftDegrees *= fovScale;
			fovRight.rightDegrees *= fovScale;

			hmdDevice.setFieldOfView(fovLeft, fovRight);
		}

		resize();

		if ('getCurrentEyeFieldOfView' in hmdDevice) {
			fovLeft = hmdDevice.getCurrentEyeFieldOfView('left');
			fovRight = hmdDevice.getCurrentEyeFieldOfView('right');
		}
		else {
			fovLeft = hmdDevice.getRecommendedEyeFieldOfView('left');
			fovRight = hmdDevice.getRecommendedEyeFieldOfView('right');
		}

		cameraLeft.projectionMatrix = perspectiveMatrixFromVRFieldOfView(fovLeft,
			NEAR, FAR);
		cameraRight.projectionMatrix = perspectiveMatrixFromVRFieldOfView(fovRight,
			NEAR, FAR);
	}

	var printVector = function(v) {
		console.log(v);
	};

	var enumerateVRDevices = function enumerateVRDevices(devices) {
		// First find an HMD device
		for (var i = 0; i < devices.length; ++i) {
			if (devices[i] instanceof HMDVRDevice) {
				hmdDevice = devices[i];

				var eyeOffsetLeft = hmdDevice.getEyeTranslation('left');
				var eyeOffsetRight = hmdDevice.getEyeTranslation('right');
				//document.getElementById('leftTranslation').innerHTML =
				printVector(eyeOffsetLeft);
				//document.getElementById('rightTranslation').innerHTML =
				printVector(eyeOffsetRight);

				cameraLeft.position.add(eyeOffsetLeft);
				//cameraLeft.position.z = 12;
				//
				cameraRight.position.add(eyeOffsetRight);
				//cameraRight.position.z = 12;

				resizeFOV(0.0);
			}
		}

		// Next find a sensor that matches the HMD hardwareUnitId
		for (i = 0; i < devices.length; ++i) {
			if (devices[i] instanceof PositionSensorVRDevice &&
				(!hmdDevice ||
				devices[i].hardwareUnitId === hmdDevice.hardwareUnitId)
			) {
				sensorDevice = devices[i];
			}
		}
		if (!hmdDevice || !sensorDevice) {
			alert('Didn\'t find a HMD and sensor!');
			return;
		}
	};

	var updateScene = function() {
		var state = sensorDevice.getState();
		var qrot = new THREE.Quaternion();
		qrot.set(state.orientation.x, state.orientation.y, state.orientation.z,
			state.orientation.w);
		cameraLeft.setRotationFromQuaternion(qrot);
		cameraRight.setRotationFromQuaternion(qrot);
	};
	vr.render = function (renderer, scene) {

		updateScene();

		renderer.enableScissorTest(true);

		renderer.setScissor(0, 0, renderTargetWidth / 2, renderTargetHeight);
		renderer.setViewport(0, 0, renderTargetWidth / 2, renderTargetHeight);
		renderer.render(scene, cameraLeft);

		// Render right eye
		renderer.setScissor(renderTargetWidth / 2, 0, renderTargetWidth / 2,
			renderTargetHeight);
		renderer.setViewport(renderTargetWidth / 2, 0, renderTargetWidth / 2,
			renderTargetHeight);
		renderer.render(scene, cameraRight);
	};
	vr.init = function(startCallback) {
		var vrStart = function(devices) {
			try {
				enumerateVRDevices(devices);
				vr.enabled = true;
			} catch (e) {
				console.error(e);
				vr.enabled = false;
			}
			startCallback();
		};
		if (navigator.getVRDevices) {
			navigator.getVRDevices().then(vrStart);
		} else if (navigator.mozGetVRDevices) {
			navigator.mozGetVRDevices(vrStart);
		} else {
			vr.enabled = false;
			startCallback();
		}
	};
})();
