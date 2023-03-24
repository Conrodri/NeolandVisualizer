# Neoland 3D Visualizer

# 1 - What is it

The project is a 3D visualisation of the Neolands NFTS Created by the company Revolt Games.

https://www.neoland.io

# 2 - How does it work ?

The project must recieve a Land_ID to be created.

The Land is created by getting the boundaries of the land from h3-js, then get from the OverpassTurbo API all datas stocked in thoses boundaries.

After getting all thoses datas, I used three.js to recreate a 3D environment.

# 3 - How to use it ?

1 - Download the repository.

2 - Go into overpass_server folder, type `npm install`.

2.1 - Then type `npm start`.

3 - Go into NeolandVisualizer folder, type `npm install`.

3.1 - type `npm run dev` to start it as it is.

3.2 - Change the land_ID, by the ID you want, then type `npm run dev`.

Tips - If, you already created the land you are trying to recreate (with a refresh maybe), all the datas has been stocked, and will be re-used, so the creation take significantly less time.

# 4 - How is it build ?

1 - The main will initialize the scene, camera, and lights, then call a function to create get all datas from the Land selected with OverpassTurbo API.

2 - Use the fetched datas to create all buildings, roads, rivers, green (grass / forests) and yellow zones ( school / hospitals )

3 - Use the Land_ID to get every building in Neopolis in this zone, then put clicables pins at their places
