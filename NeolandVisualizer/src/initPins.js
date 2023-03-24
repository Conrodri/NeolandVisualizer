import * as THREE from 'three'
import { DisplayFBX } from './DisplayFBX'
import * as geolib from "geolib";
import { Color, Vector3 } from 'three'
import { Pins } from './Pins';
const axios = require("axios")

let allPinHitboxes = []
let allPins = []
export async function initPins(scene, buildings, land_ID, bboxes) {

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

    let land_position = h3.h3ToGeo(land_ID);
    let swp = land_position
    land_position = [swp[1], swp[0]]

    let newPos
    let newPin

    for (let i = 0; i < buildings.length; i++) {
        if (buildings[i]) {
            newPos = GPSRelativePosition([buildings[i].location.longitude, buildings[i].location.latitude], land_position)

            switch (buildings[i].type) {
                case 'culture':
                    newPin = new Pins(scene, new Vector3(newPos[1], -2, newPos[0]), buildings[i].id, modelsName[0], new Color(0xdddd00))
                    newPin = RepositionningPin(newPin, scene, bboxes)
                    allPins.push(new DisplayFBX('./models/fbx/PinkPins.fbx', 0.001, 'Model Pin', new Vector3(newPin.cone.position.x, newPin.cone.position.y, newPin.cone.position.z), scene, "Pin", new THREE.Vector3(-100, -100, -100)))
                    break;
                case 'office':
                    newPin = new Pins(scene, new Vector3(newPos[1], -2, newPos[0]), buildings[i].id, modelsName[1], new Color(0x0000dd))
                    newPin = RepositionningPin(newPin, scene, bboxes)
                    allPins.push(new DisplayFBX('./models/fbx/BluePins.fbx', 0.001, 'Model Pin', new Vector3(newPin.cone.position.x, newPin.cone.position.y, newPin.cone.position.z), scene, "Pin", new THREE.Vector3(-100, -100, -100)))
                    break;
                case 'shop':
                    newPin = new Pins(scene, new Vector3(newPos[1], -2, newPos[0]), buildings[i].id, modelsName[2], new Color(0xdd0000))
                    newPin = RepositionningPin(newPin, scene, bboxes)
                    allPins.push(new DisplayFBX('./models/fbx/OrangePins.fbx', 0.001, 'Model Pin', new Vector3(newPin.cone.position.x, newPin.cone.position.y, newPin.cone.position.z), scene, "Pin", new THREE.Vector3(-100, -100, -100)))
                    break;
                case 'food':
                    newPin = new Pins(scene, new Vector3(newPos[1], -2, newPos[0]), buildings[i].id, modelsName[3], new Color(0xee9f27))
                    newPin = RepositionningPin(newPin, scene, bboxes)
                    allPins.push(new DisplayFBX('./models/fbx/RedPins.fbx', 0.001, 'Model Pin', new Vector3(newPin.cone.position.x, newPin.cone.position.y, newPin.cone.position.z), scene, "Pin", new THREE.Vector3(-100, -100, -100)))
                    break;
                case 'bar':
                    newPin = new Pins(scene, new Vector3(newPos[1], -2, newPos[0]), buildings[i].id, modelsName[4], new Color(0x800080))
                    newPin = RepositionningPin(newPin, scene, bboxes)
                    allPins.push(new DisplayFBX('./models/fbx/PurplePins.fbx', 0.001, 'Model Pin', new Vector3(newPin.cone.position.x, newPin.cone.position.y, newPin.cone.position.z), scene, "Pin", new THREE.Vector3(-100, -100, -100)))
                    break;
            }
            if (newPin != null) {
                allPinHitboxes.push(newPin)
            }
        }
    }
}

export async function GetAllPins() {
    return allPinHitboxes
}

function RepositionningPin(pin, scene, bboxes) {

    let bboxPin = new THREE.Box3().setFromObject(pin.cone);

    // let helper = new THREE.Box3Helper(bboxPin, 0x000000);
    // scene.add(helper);

    for (let i = 0; i < bboxes.length; i++) {
        if (bboxPin.intersectsBox(bboxes[i])) {
            while (bboxPin.intersectsBox(bboxes[i])) {
                pin.cone.position.y += 0.01
                bboxPin = new THREE.Box3().setFromObject(pin.cone);
            }
        }
    }

    return pin
}

export function AnimPins() {

    for (let i = 0; i < allPins.length; i++) {
        if (allPins.length > 1)
            if (allPins[i].model)
                if (allPins[i].model.children[0]) {
                    allPins[i].model.children[0].rotation.z += 0.02
                }
    }
}


function GPSRelativePosition(objPosi, centerPosi) {

    // Get GPS distance
    let dis = geolib.getDistance(objPosi, centerPosi)

    // Get bearing angle
    let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)

    // Calculate X by centerPosi.x + distance * cos(rad)
    let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))

    // Calculate Y by centerPosi.y + distance * sin(rad)
    let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))

    // Reverse X (it work) 
    return [-x / 100, y / 100]
}
