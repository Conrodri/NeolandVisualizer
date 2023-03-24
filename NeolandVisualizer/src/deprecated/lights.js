
import * as THREE from 'three'

export async function initLights(scene, gui){
    /**
     * Lights
     */
    const params = {
        pointLightColor: 0xffffff,
        secndPointLightColor: 0xffffff,
        directionalLightColor: 0xffffff
    };

    const light = new THREE.AmbientLight(params.secndPointLightColor, 0.2)
    scene.add(light)
    //gui.add(light, 'intensity').min(0).max(10).step(0.01).name('Global light intensity')


    const pointLight = new THREE.PointLight(params.secndPointLightColor, 50, 50)
    pointLight.position.set(19, 10, 56)
    pointLight.castShadow = true
    pointLight.shadow.normalBias = 0.05
    pointLight.shadow.mapSize.set(1024, 1024)
    pointLight.shadow.camera.near = 1
    pointLight.shadow.camera.far = 6
    pointLight.shadow.camera.top = 2
    pointLight.shadow.camera.right = 2
    pointLight.shadow.camera.bottom = - 2
    pointLight.shadow.camera.left = - 2
    scene.add(pointLight)

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1, params.pointLightColor)
    scene.add(pointLightHelper)

    const lightHelp = new THREE.CameraHelper(pointLight.shadow.camera)
    scene.add(lightHelp)

    let LightPos = gui.addFolder('XYZ lights')
    LightPos.add(pointLight.position, 'x').min(-100).max(100).step(0.01).name('light.x')
    LightPos.add(pointLight.position, 'y').min(0).max(100).step(0.01).name('light.y')
    LightPos.add(pointLight.position, 'z').min(-100).max(100).step(0.01).name('light.z')
    LightPos.add(pointLight, 'intensity').min(0).max(100).step(0.05).name('light.intensity')
}