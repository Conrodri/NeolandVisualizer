import * as THREE from 'three'
import { DisplayFBX } from './DisplayFBX'
import { Vector3 } from 'three' 

let allModels = []
let BuildingsAreDoneCharging = false
let model
let savedPin
let savedCam
let sprite
let cylinder
let sign
let globalCam
let savedBuilding

export async function initNeolandBuilding(scene, building, pin, camera, description = false, gui) {

    if (pin == savedPin) return;

    savedCam = camera
    console.log(building)

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

    if (model) {
        if (model.model)
            scene.remove(scene.getObjectById(model.model.id))
    }
    if (cylinder)
        scene.remove(scene.getObjectById(cylinder.id))
    if (sprite)
        scene.remove(scene.getObjectById(sprite.id))
    if (sign)
        scene.remove(scene.getObjectById(sign.model.id))


    pin.visible = false
    switch (building.type) {
        case 'culture':
            model = await new DisplayFBX(modelsName[0], 0.000125, building.name, new Vector3(pin.position.x, pin.position.y + 0.1, pin.position.z), scene, "Buildings", new THREE.Vector3(-100, -100, -100), camera.position, new Vector3(camera.position.x, camera.position.y, camera.position.z))
            break;
        case 'office':
            model = await new DisplayFBX(modelsName[1], 0.000125, building.name, new Vector3(pin.position.x, pin.position.y + 0.1, pin.position.z), scene, "Buildings", new THREE.Vector3(-100, -100, -100), camera.position, new Vector3(camera.position.x, camera.position.y, camera.position.z))
            break;
        case 'shop':
            model = await new DisplayFBX(modelsName[2], 0.000125, building.name, new Vector3(pin.position.x, pin.position.y + 0.1, pin.position.z), scene, "Buildings", new THREE.Vector3(-100, -100, -100), camera.position, new Vector3(camera.position.x, camera.position.y, camera.position.z))
            break;
        case 'food':
            model = await new DisplayFBX(modelsName[3], 0.000125, building.name, new Vector3(pin.position.x, pin.position.y + 0.1, pin.position.z), scene, "Buildings", new THREE.Vector3(-100, -100, -100), camera.position, new Vector3(camera.position.x, camera.position.y, camera.position.z))
            break;
        case 'bar':
            model = await new DisplayFBX(modelsName[4], 0.000125, building.name, new Vector3(pin.position.x, pin.position.y + 0.1, pin.position.z), scene, "Buildings", new THREE.Vector3(-100, -100, -100), camera.position, new Vector3(camera.position.x, camera.position.y, camera.position.z))
            break;
    }

    savedPin = pin
    savedBuilding = building

    model.position.set(savedPin.position.x, savedPin.position.y + 0.5, savedPin.position.z)
    CreateHexagonUnderModel(scene, new THREE.Vector3(savedPin.position.x, savedPin.position.y + 0.485, savedPin.position.z))
}



function CreateHexagonUnderModel(scene, pos, gui) {

    const geometry = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 6);
    let material
    let color = 0xeeeeee
    switch (savedBuilding.type) {
        case 'culture':
            material = new THREE.MeshPhongMaterial({ color: color });
            break;
        case 'office':
            material = new THREE.MeshPhongMaterial({ color: color });
            break;
        case 'shop':
            material = new THREE.MeshPhongMaterial({ color: color });
            break;
        case 'food':
            material = new THREE.MeshPhongMaterial({ color: color });
            break;
        case 'bar':
            material = new THREE.MeshPhongMaterial({ color: color });
            break;
    }
    const cyl = new THREE.Mesh(geometry, material);
    scene.add(cyl);
    cylinder = cyl
    cyl.position.set(pos.x, pos.y, pos.z)
}

export function GetCylBuilding() {
    return cylinder
}

export function GetBuildingToLookAtCamera(camPos) {
    if (!model) return
    if (!model.model) return
    if (model.model) {
        if (camPos.x) {
            model.model.lookAt(camPos.x, camPos.y, camPos.z)
        }
        //     if (sign.model)
        //         if (camPos.x) {
        //             savedCam.lookAt(model.model.position.x, model.model.position.y, model.model.position.z)
        //             // globalCam.add(model.model)
        //             model.model.position.set(-0.5, 0, -1)
        //             model.model.translateX(0.1)
        //             sign.model.position.set(model.model.position.x, model.model.position.y, model.model.position.z)
        //             sign.model.lookAt(-camPos.x, model.model.position.y, camPos.z)
        //             model.model.translateX(-0.1)
        //         }
    }
}


export function GetBuildingDescriptionArray() {
    if (sprite) {
        return sprite
    }
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
