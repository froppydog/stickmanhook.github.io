// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50,50),
  new THREE.MeshStandardMaterial({color:0x999999})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// Controls
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener('click', ()=>controls.lock());
camera.position.set(0,1.6,10);

// Movement
const keys = {};
document.addEventListener('keydown', e => keys[e.code]=true);
document.addEventListener('keyup', e => keys[e.code]=false);

// UI
let money=0, sold=0, isCashier=false;
document.getElementById('beCashier').onclick = ()=>{
    isCashier = !isCashier;
    document.getElementById('info').innerText = isCashier ? "You are cashier. Wait for customers at checkout." : "You are shopping!";
};

function updateUI(){
    document.getElementById('money').innerText = money;
    document.getElementById('sold').innerText = sold;
}

// GLTF Loader
const loader = new THREE.GLTFLoader();
const shelves = [];
const products = [];
const customers = [];
const checkoutZone = {x:0,z:-20,r:2};

// Load multiple shelves
for(let i=-20;i<=20;i+=10){
    for(let j=-10;j<=10;j+=5){
        loader.load('models/shelf.glb', gltf=>{
            const shelf = gltf.scene;
            shelf.position.set(i,0,j);
            shelf.scale.set(1.5,1.5,1.5);
            scene.add(shelf);
            shelves.push(shelf);

            // Add products on shelf
            for(let k=0;k<3;k++){
                loader.load('models/product.glb', pgltf=>{
                    const p = pgltf.scene.clone();
                    p.position.set(i-1+k,1,j);
                    p.scale.set(0.5,0.5,0.5);
                    scene.add(p);
                    products.push(p);
                });
            }
        });
    }
}

// Spawn customers
function spawnCustomer(){
    loader.load('models/customer.glb', gltf=>{
        const customer = gltf.scene;
        customer.position.set(Math.random()*20-10,0.5,-20);
        customer.scale.set(0.5,0.5,0.5);
        customer.target = products[Math.floor(Math.random()*products.length)];
        customer.speed = 0.05 + Math.random()*0.05;
        customer.state = "walking";
        scene.add(customer);
        customers.push(customer);
    });
}
for(let i=0;i<5;i++) spawnCustomer();

// Animate loop
function animate(){
    requestAnimationFrame(animate);

    // Player movement
    const speed = 0.1;
    if(keys['KeyW']) controls.moveForward(speed);
    if(keys['KeyS']) controls.moveForward(-speed);
    if(keys['KeyA']) controls.moveRight(-speed);
    if(keys['KeyD']) controls.moveRight(speed);

    // Customers AI
    for(let c of customers){
        if(c.state === "walking"){
            const dir = new THREE.Vector3(c.target.position.x-c.position.x,0,c.target.position.z-c.position.z);
            if(dir.length()>0.1){
                dir.normalize();
                c.position.add(dir.multiplyScalar(c.speed));
            } else {
                c.state = "toCheckout";
                c.target.visible=false;
            }
        } else if(c.state === "toCheckout"){
            const dir = new THREE.Vector3(checkoutZone.x-c.position.x,0,checkoutZone.z-c.position.z);
            if(dir.length()>0.1){
                dir.normalize();
                c.position.add(dir.multiplyScalar(c.speed));
            } else {
                if(isCashier){
                    money+=10;
                    sold+=1;
                    updateUI();
                }
                c.position.set(Math.random()*20-10,0.5,-20);
                c.target = products[Math.floor(Math.random()*products.length)];
                c.state="walking";
                c.target.visible=true;
            }
        }
    }

    renderer.render(scene,camera);
}

animate();

window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
