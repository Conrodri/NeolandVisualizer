import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { DisplayFBX } from '../DisplayFBX'
import * as geolib from "geolib";

import { AxesHelper, BoxBufferGeometry, CameraHelper, CylinderBufferGeometry, Material, Mesh, ObjectSpaceNormalMap, Sphere, Vector3 } from 'three'
import { h3ToGeo } from "h3-js";
import Stats from 'stats.js'
import all from 'gsap/all'
const axios = require("axios")

let allModels = []
let allBbox = []
let BuildingsAreDoneCharging = false

export async function initBuildings(scene, land_ID) {

    /**
    * Stocking Batiments Names to get them easily (modelsName[0])
    */
    let modelsName = []
    modelsName.push('./models/fbx_optimized/Culture_lvl1.fbx')
    modelsName.push('./models/fbx_optimized/Office_lvl1.fbx')
    modelsName.push('./models/fbx_optimized/Shop_lvl1.fbx')
    modelsName.push('./models/fbx_optimized/Restaurant_lvl1.fbx')
    modelsName.push('./models/fbx_optimized/Bar_lvl1.fbx')
    modelsName.push('./models/fbx_optimized/Culture_lvl2.fbx')
    modelsName.push('./models/fbx_optimized/Fountain.fbx')
    modelsName.push('./models/fbx_optimized/River_test2.fbx')
    modelsName.push('./models/fbx_optimized/test_perso4.fbx')
    modelsName.push('./models/fbx_optimized/xyz.fbx')
    modelsName.push('./models/fbx_optimized/Fence.fbx')

    let modelsNameTest = []
    modelsNameTest.push('./models/fbx/Fountain.fbx')
    modelsNameTest.push('./models/fbx/Item_Stand.fbx')

    const h3 = require("h3-js");

    const response = await axios.post("https://buildings.neopolis.app/v1/getBuildings", {
        cell_ids: [land_ID]
    })

    let land_position = h3.h3ToGeo(land_ID);
    let swp = land_position
    land_position = [swp[1], swp[0]]

    let buildings = response.data.success
    console.log(buildings)

    let count = 0
    for (let i = 0; i < buildings.length; i++) {

        let newPos = GPSRelativePosition([buildings[i].location.longitude, buildings[i].location.latitude], land_position)

        switch(buildings[i].type){
            case 'culture':
                new DisplayFBX(modelsName[0], 0.000125, buildings[i].name, new Vector3(newPos[1], 0, newPos[0]), scene, "Buildings")
                break;
            case 'office':
                new DisplayFBX(modelsName[1], 0.000125, buildings[i].name, new Vector3(newPos[1], 0, newPos[0]), scene, "Buildings")
                break;
            case 'shop':
                new DisplayFBX(modelsName[2], 0.000125, buildings[i].name, new Vector3(newPos[1], 0, newPos[0]), scene, "Buildings")
                break;
            case 'food':
                new DisplayFBX(modelsName[3], 0.000125, buildings[i].name, new Vector3(newPos[1], 0, newPos[0]), scene, "Buildings")
                break;
            case 'bar':
                new DisplayFBX(modelsName[4], 0.000125, buildings[i].name, new Vector3(newPos[1], 0, newPos[0]), scene, "Buildings")
                break;
        }
        count++;
    }
    
    BuildingsAreDoneCharging = true
    return allBbox
}

// Need to create Class for Allmodels
export function AnimBuildings(time){
    if(BuildingsAreDoneCharging && allModels[0])
    {
        for (let i = 0; i < allModels.length; i++) {
            allModels[i].rotation.y += 0.02

            allModels[i].position.y = (Math.cos( time ) * 0.1) + 1.05;
        }
    }
}

function GPSRelativePosition(objPosi, centerPosi, green = false) {
    // Get GPS distance
    let dis = 0
    if (objPosi[1] < objPosi[0]) {
      dis = geolib.getDistance([objPosi[1], [objPosi[0]]], centerPosi);
    }
    else {
      dis = geolib.getDistance(objPosi, centerPosi);
    }
  
    // Get bearing angle
    let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi);
  
  
    if (dis > 100000) {
      let swp = [objPosi[1], objPosi[0]]
      dis = geolib.getDistance(swp, centerPosi);
      bearing = geolib.getRhumbLineBearing(swp, centerPosi);
    }
  
    // Calculate X by centerPosi.x + distance * cos(rad)
    let x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);
  
    // Calculate Y by centerPosi.y + distance * sin(rad)
    let y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);
  
    // Reverse X (it work)
    return [-x / 100, y / 100];
  }
