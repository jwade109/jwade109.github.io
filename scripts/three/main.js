"use strict";

function eval_orbit(sma, period, time, origin, ecc=0)
{
    const t = time / period * Math.PI * 2; // approximation for true anomaly
    const x = origin.x + sma * (Math.cos(t) - ecc);
    const y = origin.y;
    const z = origin.z + sma * Math.sin(t) * Math.sqrt(1 - Math.pow(ecc, 2));
    return new THREE.Vector3(x, y, z);
}

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const fov = 60; // degrees
const aspect = window.innerWidth / window.innerHeight;
const near_clip = 1;
const far_clip = 10000000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near_clip, far_clip);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 4;
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;

camera.position.set(1.6*AU, AU, 0);
controls.update();

function add_planet_mesh(radius, color, emissive=false)
{
    const geom = new THREE.SphereGeometry(radius);
    let mat = new THREE.MeshStandardMaterial({ color: color });
    if (emissive)
    {
        mat = new THREE.MeshStandardMaterial({
            emissive: color, emissiveIntensity: 3 });
    }
    const sphere = new THREE.Mesh(geom, mat);
    scene.add(sphere);
    return sphere;
}

const earth = add_planet_mesh(EARTH_RADIUS, 0x4444ff);
// const moon = add_planet_mesh(LUNA_RADIUS, 0xbbbbbb);
const sun = add_planet_mesh(SOL_RADIUS, 0xf9d71c, true);
const mars = add_planet_mesh(MARS_RADIUS, 0xd1600f);
const venus = add_planet_mesh(VENUS_RADIUS, 0xe39e1c);
const mercury = add_planet_mesh(MERCURY_RADIUS, 0xada8a5);
const jupiter = add_planet_mesh(JUPITER_RADIUS, 0xc99039);
const saturn = add_planet_mesh(SATURN_RADIUS, 0xead6b8);
const uranus = add_planet_mesh(URANUS_RADIUS, 0xafdbf5);
const neptune = add_planet_mesh(NEPTUNE_RADIUS, 0x477efd);
const pluto = add_planet_mesh(PLUTO_RADIUS, 0xf6ddbd);

scene.add(new THREE.PointLight(0xffffff, 2, 3000));
scene.add(new THREE.AmbientLight(0x0a0a0a, 0.2));

const ALL_SMAS = [EARTH_SMA, MARS_SMA, MERCURY_SMA, VENUS_SMA, JUPITER_SMA, SATURN_SMA, URANUS_SMA, NEPTUNE_SMA, PLUTO_SMA];

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
    [EARTH_SMA, earth, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    // [LUNA_SMA, moon, earth.position, EARTH_MASS, EARTH_ECCENTRICITY],
    [MARS_SMA, mars, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [VENUS_SMA, venus, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [MERCURY_SMA, mercury, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [JUPITER_SMA, jupiter, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [SATURN_SMA, saturn, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [NEPTUNE_SMA, neptune, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [URANUS_SMA, uranus, zero_vector, SOL_MASS, EARTH_ECCENTRICITY],
    [PLUTO_SMA, pluto, zero_vector, SOL_MASS, EARTH_ECCENTRICITY]
];

for (let [sma, body, origin, origin_mass, ecc] of orbits)
{
    let points = []
    const period = orbital_period(sma, origin_mass * GRAVITATIONAL_CONSTANT);
    const N = 300;
    for (let i = 0; i <= N; ++i)
    {
        let t = period * i / N;
        points.push(eval_orbit(sma, period, t, origin, ecc));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x212121 });
    const ellipse = new THREE.Line(geometry, material);
    scene.add(ellipse);
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

renderer.setSize(window.innerWidth, window.innerHeight);

function animate()
{
    const now = new Date().getTime() / 1000;

    for (let [sma, body, origin, origin_mass, ecc] of orbits)
    {
        const period = orbital_period(sma, origin_mass * GRAVITATIONAL_CONSTANT);
        let p = eval_orbit(sma, period, now, origin, ecc);
        body.position.set(p.x, p.y, p.z);
    }

    requestAnimationFrame(animate);
    // controls.target = earth.position;
    controls.update();
    renderer.render(scene, camera);
}

animate();