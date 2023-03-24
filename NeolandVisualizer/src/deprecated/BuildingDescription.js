import * as THREE from 'three'
import { DisplayFBX } from '../DisplayFBX'
import * as geolib from "geolib";
import { Sprite, Vector3 } from 'three'


export async function initBuildingDescription(scene, building, cameraPos, pinPos) {

    var map = new THREE.TextureLoader().load( "./models/png/popup.png" );
    var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
    var sprite = new THREE.Sprite( material );
    scene.add( sprite );

    sprite.material.opacity = 4
    sprite.position.set(pinPos.x, pinPos.y + 0.2, pinPos.z)
    sprite.scale.set(0.2, 0.2, 0.2) 
    sprite.lookAt(new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z))

    return sprite
}

// Need to create Class for Allmodels
export function AnimBuildings(time) {
    if (BuildingsAreDoneCharging && allModels[0]) {
        for (let i = 0; i < allModels.length; i++) {
            allModels[i].rotation.y += 0.02
            allModels[i].position.y = (Math.cos(time) * 0.1) + 1.05;
        }
    }
}


