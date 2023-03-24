import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { AxesHelper, BoxBufferGeometry, CameraHelper, CylinderBufferGeometry, Material, Mesh, ObjectSpaceNormalMap, Sphere, Vector3 } from 'three'
import {getTab} from './response'
import { h3ToGeo } from "h3-js";
import Stats from 'stats.js'
import { Arena } from './ArenaBuilding'
const axios = require("axios")

let allModels = []
let BuildingsAreDoneCharging = false


export async function initFloatyBuildings(scene, camera, renderer, RealHexObj) {

    let mixer = []
    let clock = new THREE.Clock()
    let delta
    let nbMixer = 0

    /**
     *  Load FBX Object
     * @param {path of the obj} path 
     * @param {scale of the obj} scale 
     * @param {name in gui} name 
     * @param {Vector3 for position} pos 
     */
    async function loadFBX(path, scale, name = 'object', pos = new Vector3(0, 0, 0)) {
        
            const loader = new FBXLoader();
            loader.load(
                path,
                (fbx) => {

                    let model = fbx
                    model.scale.set(scale, scale, scale)
                    model.position.set(pos.x, pos.y, pos.z)
                    model.name = name
                    model.rotation.y = model.rotation.y * (Math.PI * 0.5)
                    model.castShadow = true
                    model.receiveShadow = true
                    model.traverse(function (object) {
                        object.castShadow = true
                        object.receiveShadow = true
                        if (object instanceof THREE.PointLight) {
                            object.intensity = 0.5
                            object.distance = 10
                            object.castShadow = true
                        }
                    });

                    /**
                     * Add animation to an array, used to play them all at the same time,
                     * Not depending on the number of animation you have 
                    */
                    if (model.animations.length > 0) {
                        mixer.push(new THREE.AnimationMixer(model))
                        for (let i = 0; i < model.animations.length; i++) {
                            mixer[nbMixer].clipAction(model.animations[i]).play();
                        }
                        animate(true)
                        nbMixer++
                    }
                    model.alpha = 0.80
                    new Arena(model.position, scene)
                    allModels.push(model)
                    scene.add(model)     
                })

                function animate(test = false) {

                    requestAnimationFrame(animate);
            
                    delta = clock.getDelta()    
                    
                    for (let i = 0; i < mixer.length; i++) {
                        mixer[i].update(delta)
                    }
                }
    };

    /**
     * Can import 1 model or a full line, FBX or GLTF models
     * @param {Obj.z} z 
     * @param {Obj.x} x 
     * @param {path of the obj} pathObj
     * @param {scale of the obj} scale 
     * @param {Obj.y} y
     * @param {Boolean for OBJ or FBX} obj 
     */
    function buildingPositionCreator(z, x, pathObj, name = '', scale = 0.025, y = 0, obj = false) {
        if(RealHexObj[z][x] != undefined || RealHexObj[z].length < nx || RealHexObj.length < ny)
        {
            console.log(z , x )
            loadFBX(pathObj, scale, name, new Vector3(RealHexObj[z][x].position.x, y, RealHexObj[z][x].position.z))
        }
    }

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

    const index = h3.geoToH3( 45.764042, 4.835659, 8)
    const index2 =  h3.geoToH3( 45.7136, 4.80697, 8)
    const index3 = h3.geoToH3( 48.8446, 2.295, 8)

    // console.log(index)

    const response = await axios.post("https://buildings.neopolis.app/v1/getBuildings", {
        cell_ids: [index3]
    })
    //console.log(response.data.success)

    let hexCenterCoordinates = h3.h3ToGeo(index3);

    let buildings = response.data.success

    let nx = []
    let ny = []
    for (let i = 0; i < buildings.length; i++) {
            nx.push((buildings[i].location.latitude - hexCenterCoordinates[0]) * 10000)
            ny.push((buildings[i].location.longitude - hexCenterCoordinates[1]) * 10000)
    }

    for (let i = 0; i < buildings.length; i++) {

        let xTest = (nx[i] * 5.4) /10
        let zTest = (ny[i] * 3.8) /10
        // let xTest = (nx[i] * 5.4) + RealHexObj[29][29].position.x
        // let zTest = (ny[i] * 3.8) + RealHexObj[29][29].position.z

        //console.log(xTest, zTest)
        switch(buildings[i].type){
            case 'culture':
                await loadFBX(modelsName[0], 0.0003, buildings[i].name, new Vector3(xTest, 1, zTest))
                break;
            case 'office':
                await loadFBX(modelsName[1], 0.0003, buildings[i].name, new Vector3(xTest, 1, zTest))
                break;
            case 'shop':
                await loadFBX(modelsName[2], 0.0003, buildings[i].name, new Vector3(xTest, 1, zTest))
                break;
            case 'food':
                await loadFBX(modelsName[3], 0.0003, buildings[i].name, new Vector3(xTest, 1, zTest))
                break;
            case 'bar':
                await loadFBX(modelsName[4], 0.0003, 'bar', new Vector3(xTest, 1, zTest))
                break;
        }
    }
    BuildingsAreDoneCharging = true
}

export function AnimBuildings(time){
    if(BuildingsAreDoneCharging && allModels[0])
    {
        for (let i = 0; i < allModels.length; i++) {
            allModels[i].rotation.y += 0.02

            allModels[i].position.y = (Math.cos( time ) * 0.1) + 1.05;
        }
    }
}

