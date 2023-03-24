import * as THREE from 'three'
import { AxesHelper, BoxBufferGeometry, CameraHelper, CylinderBufferGeometry, Material, Mesh, ObjectSpaceNormalMap, Sphere, Vector3 } from 'three'
import { Threebox } from 'threebox'


export function initTiles(scene, RealHexObj, hexagonSize) {

    let cylinders = []
    const textureLoader = new THREE.TextureLoader()
    

    let stats = {
        position: new Vector3(),
        material: new Material(),
        mesh: new THREE.Mesh(),
        orientation: 0
    }

    /**
     * Loading textures to make meshes
     */
    const grassTexture = textureLoader.load('/textures/18.jpg')
    const roadTexture = textureLoader.load('/textures/road.jpg')
    const bitumeTexture = textureLoader.load('/textures/bitume.jpg')
    const sandTexture = textureLoader.load('/textures/sand.jpg')

    /**
     * Creating a cylinder geometry
     */
    const geometryBigHex = new THREE.CylinderGeometry(300, 300, 3, 6, 50);

    const geometryHex = new THREE.CylinderGeometry(5.7, 5.7, 3, 6, 50);
    const geometryGiantHex = new THREE.CylinderGeometry(5.7, 5.7, 300, 6, 50);


    /**
     * Initializing Meshes for the cylinders
     */
    const roadmaterial = new THREE.MeshStandardMaterial({ map: roadTexture })
    const grassmaterial = new THREE.MeshStandardMaterial({ map: grassTexture })
    const bitumematerial = new THREE.MeshStandardMaterial({ map: bitumeTexture })
    const sandmaterial = new THREE.MeshStandardMaterial({ map: sandTexture })
    const whiteMaterial = new THREE.MeshStandardMaterial({color:0xaaddaa})

    let cylinder
    let HexagonsTab = []
    let HexagonsBorderTab = []

    // CreateFullHexagon(hexagonSize)
    // CreateRealHexObj()
   // createFloorHex()

    function createFloorHex(){
        cylinder = new THREE.Mesh(geometryBigHex, whiteMaterial);
        cylinder.receiveShadow = true;
        cylinder.position.set(0, 0, 0)
        cylinder.rotation.set(0, 0, 0)
        cylinder.scale.set(1, 1, 1)
        cylinder.updateProjectionMatrix = true
        scene.add(cylinder);
    }
    /**
     * Create an hexagon a the position selected
     * @param { Vector3 } pos
     */
    function createHex(pos = new Vector3(0, 0, 0)) {

        cylinder = new THREE.Mesh(geometryHex, bitumematerial);
        cylinder.receiveShadow = true;
        cylinder.position.set(pos.x, pos.y, pos.z)
        cylinder.rotation.set(0, 0, 0)
        cylinders.updateProjectionMatrix = true

        stats.position = pos
        stats.mesh = cylinder

        cylinders.push(cylinder)
        HexagonsTab.push(cylinder)
        scene.add(cylinder);
        return pos
    };

    /**
    * Create an hexagon a the position selected
    * @param { Vector3 } pos
    */
    function createGiantHex(pos = new Vector3(0, 150, 0)) {
        cylinder = new THREE.Mesh(geometryGiantHex, bitumematerial);
        cylinder.receiveShadow = true;
        cylinder.position.set(pos.x, pos.y, pos.z)
        cylinders.updateProjectionMatrix = true

        stats.position = pos
        stats.mesh = cylinder

        cylinders.push(cylinder)
        HexagonsBorderTab.push(cylinder)
        scene.add(cylinder);
    };

    function CreateFullHexagon(size) {
        let offset = Math.sqrt(3) * 5.7
        let moveOffset = offset / 2

        let nb = 0
        let unscale = 0
        let scale = 0

        for (let x = -1; x < size; x++) {
            // Create the hexagonal border to the North
            //createGiantHex(new Vector3(x * (offset) + moveOffset, 150, -1 * (moveOffset * 1.73) - 1))
        }

        for (let y = 0; y < size * 2 - 1; y++) {

            if (nb < size) {
                // Create the hexagonal border to the North West
                //createGiantHex(new Vector3(-1 * offset - moveOffset * y, 150, y * (moveOffset * 1.73) - 1))

                // Create the 1st Half part of the hexagon
                for (let x = 0; x < size + nb; x++) {
                    createHex(new Vector3(x * offset - moveOffset * y, 0.5, y * (moveOffset * 1.73) - 1))
                }
                nb++
                scale = nb

                // Create the hexagonal border to the South West
                //createGiantHex(new Vector3((size + nb - 1) * offset - moveOffset * y, 150, y * (moveOffset * 1.73) - 1))
            }
            else {
                // Create the hexagonal border to the North East
                //createGiantHex(new Vector3(-1 * offset - moveOffset * Math.abs(y - (size * 2 - 1)) + moveOffset, 150, y * (moveOffset * 1.73) - 1))

                // Create the 2nd Half part of the hexagon
                for (let x = 0; x < (size + scale) - unscale - 2; x++) {
                    createHex(new Vector3(x * offset - moveOffset * Math.abs(y - (size * 2 - 1)) + moveOffset, 0.5, y * (moveOffset * 1.73) - 1))
                }

                // Create the hexagonal border to the South East
                //createGiantHex(new Vector3((((size + scale) - unscale - 2.1) * offset - moveOffset * Math.abs(y - (size * 2 - 1)) + moveOffset) + 1, 150, y * (moveOffset * 1.73) - 1))

                unscale++
            }
            // Used to delimit rows in the object tab
            if (y != size * 2 - 1)
                HexagonsTab.push("nextRow")
        }
        for (let x = -1; x < size; x++) {
            // Create the hexagonal border to the South
            //createGiantHex(new Vector3(x * (offset) + moveOffset, 150, (size * 2 - 1) * (moveOffset * 1.73) - 1))
        }
        //console.log(count)
    }

    /**
     * Puts all Hexagons models in an array
     */
    function CreateRealHexObj() {
        let k = 0
        let x = -1
        for (let i = -1; i < HexagonsTab.length; i++) {
            if (i != HexagonsTab.length - 1) {

                if (HexagonsTab[i] == "nextRow" || x == -1) {
                    x++
                    RealHexObj[x] = []
                    i++
                    k = 0
                }
                RealHexObj[x][k] = HexagonsTab[i]
                k++
            }
        }
        //console.log(RealHexObj)
    }

    // console.log(RealHexObj.length)
    // console.log(RealHexObj[0].length)
    // for (let j = 0; j < RealHexObj.length; j++) {
    //     for (let i = 0; i < RealHexObj[j].length; i++) {
    //         if (i >= 10 && i <= 30 && j > 10 && j < RealHexObj.length - 10)
    //             RealHexObj[j][i].material = grassmaterial
    //         else if (i >= 30 && i <= 70 && j > 10 && j < RealHexObj.length - 10)
    //             RealHexObj[j][i].material = sandmaterial
    //         else if (i >= 0 && i <= 10 && j > 10 && j < RealHexObj.length - 10)
    //             RealHexObj[j][i].material = sandmaterial
    //         else {
    //             RealHexObj[j][i].material = bitumematerial
    //         }
    //     }
    //     //console.log(j)
    // }

    RealHexObj.forEach(element => {
        element.material = sandmaterial
    })

    HexagonsBorderTab.forEach(element => {
        element.material = bitumematerial
    });

}