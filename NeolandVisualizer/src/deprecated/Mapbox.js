import mapboxgl from "mapbox-gl";
import {Threebox} from 'threebox';
import * as THREE from 'three'

export async function CreateMapBoxWorld(lat, lon, scene) {

	mapboxgl.accessToken = "pk.eyJ1IjoiY29uc3RhbnRyb2RyaWd1ZXoiLCJhIjoiY2w1aWJudDVkMDRqbjNtbnVjeGp5cTA5dSJ9.Tz0GX1fFmM_pWGmF2GNWxg";

	//starting location for both map and eventual sphere
	var origin = [lat, lon, 300];
	let tb
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/light-v9',
		center: origin,
		zoom: 15,
		pitch: 60,
		bearing: 80
	});


	map.on('style.load', function () {

		map.addLayer({
			"id": '3d-buildings',
			"source":"composite",
			"source-layer":"building",
			"filter":["==","extrude","true"],
			"type": 'fill-extrusion',
			paint:{
				"fill-extrusion-height":{
					property:"height",
					type:"identity"
				},
				"fill-extrusion-base":{
					property:"min_height",
					type:"identity"
				},
				"fill-extrusion-color":"#aaa",
				"fill-extrusion-opacity":1
			},
			onAdd: function (map, mbxContext) {

				tb = new Threebox(
					map,
					mbxContext,
					{ defaultLights: true }
				);

				// initialize geometry and material of our cube object
				var geometry = new THREE.BoxGeometry(200, 200, 200);

				var redMaterial = new THREE.MeshPhongMaterial({
					color: 0x009900,
					side: THREE.DoubleSide
				});

				var cube = new THREE.Mesh(geometry, redMaterial);

				cube = tb.Object3D({ obj: cube })
					.setCoords(origin)

				tb.add(cube)
			},

			render: function (gl, matrix) {
				tb.update();
			}
		});
	});
	return map
}
