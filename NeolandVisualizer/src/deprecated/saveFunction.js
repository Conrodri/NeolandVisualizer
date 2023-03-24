/**
 * Creating a custom hexagon, or shape
 */

var hexa = new THREE.BufferGeometry();

const hexagoneV3 = new Float32Array( [
     -5.0, 0.0,  -2.0,
     0.0, 0.0,  -5.0,
     0.0,  0.0, 0.0,

     0.0,  0.0,  -5.0,
     5.0,  0.0,  -2.0,
     0.0, 0.0,  0.0,

     5.0, 0.0, -2.0,
     5.0, 0.0 , 2.0,
     0.0, 0.0, 0.0,

     5.0, 0.0 , 2.0,
     0.0, 0.0, 5.0,
     0.0, 0.0, 0.0,

     0.0, 0.0 , 5.0,
     -5.0, 0.0, 2.0,
     0.0, 0.0, 0.0,

     -5.0, 0.0 , 2.0,
     -5.0, 0.0, -2.0,
     0.0, 0.0, 0.0
] );


hexa.setAttribute( 'position', new THREE.BufferAttribute( hexagoneV3, 3 ) );
var hexaObject = new THREE.MeshStandardMaterial(hexa, material);
hexaObject.scale.set(7,7,7)

//gui.add(hexaObject.scale, 'x').min(1).max(10).step(0.1)

scene.add(hexaObject);


/**
 * Fonts
 */
 const fontLoader = new FontLoader()

 fontLoader.load(
     '/fonts/helvetiker_regular.typeface.json',
     (font) =>
     {
         // Material
         const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })
 
         // Text
         const textGeometry = new TextGeometry(
             'Neoland',
             {
                 font: font,
                 size: 0.5,
                 height: 0.2,
                 curveSegments: 12,
                 bevelEnabled: true,
                 bevelThickness: 0.03,
                 bevelSize: 0.02,
                 bevelOffset: 0,
                 bevelSegments: 5
             }
         )
         textGeometry.center()
 
         const text = new THREE.Mesh(textGeometry, material)
         text.scale.set(2,2,2)
         scene.add(text)
         text.position.y = 6
         //gui.add(text.position, 'y').min(-5).max(5).step(0.1)
     }
 )

 /**
  * Old scene usage
  */

     // loadFBX('./models/fbx/Shop_lvl1.fbx', 0.5, 'shop', new Vector3(0,0.55,0)),
    // loadFBX('./models/fbx/Hexagone3.fbx', 0.025, 'hexagon', new Vector3(0,0,0)),

    // //loadFBX('./models/fbx/Office_lvl1.fbx', 0.005, 'office', new Vector3(0,0.55,10)),
    // loadFBX('./models/fbx/Hexagone2.fbx', 0.025, 'hexagon', new Vector3(0,0,10)),

    // loadFBX('./models/fbx/Hexagone2.fbx', 0.025, 'hexagon', new Vector3(0,0,20)),

    
    //  loadFBX('./models/fbx/Office_lvl1.fbx', 0.005, 'office', new Vector3(8.5,0.55,5)),
    // loadFBX('./models/fbx/Hexagone3.fbx', 0.025, 'hexagon', new Vector3(8.5,0,5)),

    // loadFBX('./models/fbx/Shop_lvl1.fbx', 0.5, 'shop',new Vector3(-8.5,0.55,5)),
    // loadFBX('./models/fbx/Hexagone3.fbx', 0.025, 'hexagon', new Vector3(-8.5,0,5)),

    // loadFBX('./models/fbx/Culture_lvl1.fbx', 0.5, 'culture',new Vector3(-8.5,0.55,15)),
    // loadFBX('./models/fbx/Hexagone3.fbx', 0.025, 'hexagon', new Vector3(-8.5,0,15)),

    // //loadFBX('./models/fbx/Office_lvl1.fbx', 0.005, 'office', new Vector3(8.5,0.55,15)),
    // loadFBX('./models/fbx/Hexagone2.fbx', 0.025, 'hexagon', new Vector3(8.5,0,15)),

    // z == line, x == column, pathobj == path to fbx. Used to create hexagons


    async function loadFBX(path, scale, name = 'object', pos = new Vector3(0, 0, 0)) {
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(
                path,
                (fbx) => {
                    fbx.scale.set(scale, scale, scale)
                    fbx.traverse(function (object) {
    
                        if (object.isMesh) {
                            object.castShadow = true
                            object.receiveShadow = true
                        }
                    });
                    models = fbx
                    models.position.set(pos.x, pos.y, pos.z)
                    objModel = models
                    models.name = name
                    models.rotation.y = models.rotation.y * (Math.PI * 0.5)
                    tabObjModel.push(objModel)
                    scene.add(models)
                    return resolve()
                })
        })
    };

async function hexaPositionCreator(z, x, pathObj, scale = 0.025, y = 0) {

    x.forEach(async element => {
        if (z == 0) {
            if (element % 2 != 0)
                await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, -5))
            else
                await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, 0))
        }
        else {
            if (element % 2 != 0) {

                if (z > 0)
                    await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.max(z * 10 - 5, 5)))
                if (z < 0)
                    await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.min(z * 10 - 5, 5)))
            }
            else {
                if (z > 0)
                    await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.max(z * 10, 10)))
                if (z < 0)
                    await loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.min(z * 10, 10)))
            }
        }
    });
}

/**
 * Hexagon position creator
 */

// z == line, x == column, pathobj == path to fbx. Used to create hexagons

// function hexaPositionCreator(z, x, pathObj, scale = 0.025, y = 0) {

//     let tabPos = []
//     let count = x[0]
    
//     for (let i = 0; i < Math.abs(x[0]) + Math.abs(x[1]); i++) {
//         tabPos.push(count + i)
//     }

//     tabPos.forEach(element => {
//         if (z == 0) {
//             if (element % 2 != 0)
//                 loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, -5))
//             else
//                 loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, 0))
//         }
//         else {
//             if (element % 2 != 0) {

//                 if (z > 0)
//                     loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.max(z * 10 - 5, 5)))
//                 if (z < 0)
//                     loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.min(z * 10 - 5, 5)))
//             }
//             else {
//                 if (z > 0)
//                     loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.max(z * 10, 10)))
//                 if (z < 0)
//                     loadFBX(pathObj, scale, '', new Vector3(element * 8.5, y, Math.min(z * 10, 10)))
//             }
//         }
//     });
// }

/**
 * Sun and moon movement / init
 */
// const geometry = new THREE.SphereGeometry( 15, 32, 16 );
// const SunMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
// const MoonMaterial = new THREE.MeshBasicMaterial( { color: 0xf0fff0 } );

// const sun = new THREE.Mesh( geometry, SunMaterial );
// sun.scale.set(0.5,0.5,0.5)
// scene.add( sun );

// const moon = new THREE.Mesh( geometry, MoonMaterial );
// moon.scale.set(0.5,0.5,0.5)
// scene.add( moon );



    // Sun movement
    // sun.position.x = Math.cos(elapsedTime * 0.3) * 100
    // sun.position.y = Math.sin(elapsedTime * 0.3) * 100

    // moon.position.x = Math.cos(-elapsedTime * 0.3) * 100 - 20
    // moon.position.y = Math.sin(-elapsedTime * 0.3) * 100 - 20
    
function loadFBX(path, scale, name = 'object', pos = new Vector3(0, 0, 0)) {
    const loader = new FBXLoader();
    loader.load(
        path,
        (fbx) => {
            fbx.scale.set(scale, scale, scale)
            fbx.traverse(function (object) {

                if (object.isMesh) {
                    object.castShadow = true
                    object.receiveShadow = true
                }
            });
            models = fbx
            models.position.set(pos.x, pos.y, pos.z)
            objModel = models
            models.name = name
            models.rotation.y = models.rotation.y * (Math.PI * 0.5)
            tabObjModel.push(objModel)
            scene.add(models)
        })
};


    await Promise.all([
        hexaPositionCreator(1, posHexa, './models/fbx/Hexagone2.fbx'),
        hexaPositionCreator(2, posHexa, './models/fbx/Hexagone2.fbx'),
        hexaPositionCreator(3, posHexa, './models/fbx/Hexagone2.fbx'),
        hexaPositionCreator(4, posHexa, './models/fbx/Hexagone2.fbx'),
        hexaPositionCreator(5, posHexa, './models/fbx/Hexagone2.fbx'),
        hexaPositionCreator(6, posHexa, './models/fbx/Hexagone2.fbx'),
    
        hexaPositionCreator(1, posCulture, './models/fbx/Culture_lvl1.fbx', 0.5, 0.5),
        hexaPositionCreator(2, posOffice, './models/fbx/Office_lvl1.fbx', 0.005, 0.5),
        hexaPositionCreator(3, posShop, './models/fbx/Shop_lvl1.fbx', 0.5, 0.5),
    ])
    