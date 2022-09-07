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
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const fov = 60; // degrees
const aspect = window.innerWidth / window.innerHeight;
const near_clip = 1;
const far_clip = 100000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near_clip, far_clip);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 4;
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;

// controls.update() must be called after any manual changes to the camera's transform
camera.position.set(-15, 10, 15);
controls.update();

function get_planet_mesh(radius, color, emissive=false)
{
    const geom = new THREE.SphereGeometry(radius);
    let mat = new THREE.MeshStandardMaterial({ color: color });
    if (emissive)
    {
        mat = new THREE.MeshStandardMaterial({
            emissive: color, emissiveIntensity: 3 });
    }
    const sphere = new THREE.Mesh(geom, mat);
    return sphere;
}

const earth = get_planet_mesh(EARTH_RADIUS, 0x4444ff);
const moon = get_planet_mesh(LUNA_RADIUS, 0xbbbbbb);
const sun = get_planet_mesh(SOL_RADIUS, 0xf9d71c, true);
const mars = get_planet_mesh(MARS_RADIUS, 0xd1600f);
const venus = get_planet_mesh(VENUS_RADIUS, 0xe39e1c);
const mercury = get_planet_mesh(MERCURY_RADIUS, 0xada8a5);
const jupiter = get_planet_mesh(JUPITER_RADIUS, 0xc99039);
const saturn = get_planet_mesh(SATURN_RADIUS, 0xead6b8);
const uranus = get_planet_mesh(URANUS_RADIUS, 0xafdbf5);
const neptune = get_planet_mesh(NEPTUNE_RADIUS, 0x477efd);
const pluto = get_planet_mesh(PLUTO_RADIUS, 0xf6ddbd);

scene.add(earth);
scene.add(moon);
scene.add(mars);
scene.add(venus);
scene.add(mercury);
scene.add(jupiter);
scene.add(saturn);
scene.add(uranus);
scene.add(neptune);
scene.add(pluto);
scene.add(sun);

scene.add(new THREE.PointLight(0xffffff, 2, 3000));
scene.add(new THREE.AmbientLight(0x0a0a0a, 0.2));

const ALL_SMAS = [EARTH_SMA, MARS_SMA, MERCURY_SMA, VENUS_SMA, JUPITER_SMA, SATURN_SMA, URANUS_SMA, NEPTUNE_SMA, PLUTO_SMA];

for (let r of ALL_SMAS)
{
    let points = []
    for (let i = 0; i <= 300; ++i)
    {
        let a = Math.PI * 2 * (i / 100);
        let x = r * Math.cos(a);
        let z = r * Math.sin(a);
        points.push(new THREE.Vector3(x, 0, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x212121 });
    const ellipse = new THREE.Line(geometry, material);
    scene.add(ellipse);
}

const zero_vector = new THREE.Vector3(0, 0, 0);

for (let i = 0; i < 12; ++i)
{
    const a = Math.PI * 2 * i / 12;
    const max_sma = Math.max(...ALL_SMAS);
    const x = Math.cos(a) * max_sma * 1.5;
    const z = Math.sin(a) * max_sma * 1.5;
    const end = new THREE.Vector3(x, 0, z);
    const geometry = new THREE.BufferGeometry().setFromPoints([zero_vector, end]);
    const material = new THREE.LineBasicMaterial({ color: 0x212121 });
    material.transparent = true;
    material.opacity = 0.3;
    scene.add(new THREE.Line(geometry, material));
}

function orbital_period(sma, mu)
{
    return 2 * Math.PI * Math.sqrt(Math.pow(sma, 3) / mu);
}

let orbits =
[
    [EARTH_SMA, earth, zero_vector, SOL_MASS],
    [LUNA_SMA, moon, earth.position, EARTH_MASS],
    [MARS_SMA, mars, zero_vector, SOL_MASS],
    [VENUS_SMA, venus, zero_vector, SOL_MASS],
    [MERCURY_SMA, mercury, zero_vector, SOL_MASS],
    [JUPITER_SMA, jupiter, zero_vector, SOL_MASS],
    [SATURN_SMA, saturn, zero_vector, SOL_MASS],
    [NEPTUNE_SMA, neptune, zero_vector, SOL_MASS],
    [URANUS_SMA, uranus, zero_vector, SOL_MASS],
    [PLUTO_SMA, pluto, zero_vector, SOL_MASS]
];

function animate()
{
    const now = new Date().getTime() / 1000;

    for (let [sma, body, origin, origin_mass] of orbits)
    {
        const period = orbital_period(sma, origin_mass * GRAVITATIONAL_CONSTANT);
        let p = eval_orbit(sma, period, now, origin);
        body.position.set(p.x, p.y, p.z);
    }

    requestAnimationFrame(animate);
    // controls.target = earth.position;
    controls.update();
    renderer.render(scene, camera);
}

animate();