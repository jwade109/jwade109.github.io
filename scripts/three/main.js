"use strict";

function eval_orbit(sma, period, time, origin)
{
    const t = time / period * Math.PI * 2;
    const x = origin.x + sma * Math.cos(t);
    const y = origin.y;
    const z = origin.z + sma * Math.sin(t);
    return new THREE.Vector3(x, y, z);
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

const fov = 60; // degrees
const aspect = window.innerWidth / window.innerHeight;
const near_clip = 1;
const far_clip = 100000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near_clip, far_clip);
const controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.zoomSpeed = 4;

// controls.update() must be called after any manual changes to the camera's transform
camera.position.set(-50, 50, 50);
controls.update();

function get_planet_mesh(radius, color, toon=false, alpha=1)
{
    const geom = new THREE.SphereGeometry(radius);
    let mat = new THREE.MeshStandardMaterial({ color: color });
    if (toon)
    {
        mat = new THREE.MeshToonMaterial({ color: color });
    }
    mat.opacity = alpha;
    mat.shadowSize = THREE.DoubleSide;
    if (alpha < 1)
    {
        mat.transparent = true;
    }
    const sphere = new THREE.Mesh(geom, mat);
    return sphere;
}

const earth = get_planet_mesh(EARTH_RADIUS, 0x4444ff);
const moon = get_planet_mesh(LUNA_RADIUS, 0xbbbbbb);
const sun = get_planet_mesh(SOL_RADIUS, 0xf9d71c, true, 1);
for (let i = 0; i < 4; ++i)
{
    const r = 1 + i / 5;
    const sun2 = get_planet_mesh(SOL_RADIUS * r, 0xf9d71c, true, 0.1);
    scene.add(sun2);
}

const mars = get_planet_mesh(MARS_RADIUS, 0xd1600f);

scene.add(earth);
scene.add(moon);
scene.add(sun);
scene.add(mars);

const light = new THREE.PointLight(0xffffff, 2, 3000);
light.position.set(sun.position.x, sun.position.y, sun.position.z);
scene.add(light);
scene.add(new THREE.AmbientLight(0x0a0a0a, 0.2));

for (let r of [EARTH_SMA, MARS_SMA])
{
    let points = []
    for (let i = 0; i <= 100; ++i)
    {
        let a = Math.PI * 2 * (i / 100);
        let x = r * Math.cos(a);
        let z = r * Math.sin(a);
        points.push(new THREE.Vector3(x, 0, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const material = new THREE.LineBasicMaterial( { color: 0x373737 } );
    const ellipse = new THREE.Line( geometry, material );
    scene.add(ellipse);
}

const zero_vector = new THREE.Vector3(0, 0, 0);

function animate()
{
    const now = new Date().getTime() / 1000;

    let ep = eval_orbit(EARTH_SMA, EARTH_PERIOD, now, zero_vector);
    earth.position.set(ep.x, ep.y, ep.z);
    let mp = eval_orbit(LUNA_SMA, LUNA_PERIOD, now, earth.position);
    moon.position.set(mp.x, mp.y, mp.z);
    let mrp = eval_orbit(MARS_SMA, MARS_PERIOD, now, zero_vector);
    mars.position.set(mrp.x, mrp.y, mrp.z);

    requestAnimationFrame(animate);
    camera.lookAt(ep.x, ep.y, ep.z);
    controls.update();
    renderer.render(scene, camera);
}

animate();