"use strict";

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

const fov = 45; // degrees
const aspect = window.innerWidth / window.innerHeight;
const near_clip = 1;
const far_clip = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near_clip, far_clip);
const controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.zoomSpeed = 4;

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(-5, 5, 0);
controls.update();

function get_planet_mesh(radius, color)
{
    const geom = new THREE.SphereGeometry(radius);
    let mat = new THREE.MeshPhongMaterial({ color: color });
    // mat.emissive = color;
    const sphere = new THREE.Mesh(geom, mat);
    return sphere;
}

const earth = get_planet_mesh(1, 0x4444ff);
const moon = get_planet_mesh(0.4, 0xbbbbbb);
const sun = get_planet_mesh(3, 0xf9d71c);
sun.position.set(-100, 0, 0);
scene.add(earth);
scene.add(moon);
scene.add(sun);

const light = new THREE.PointLight(0xffffff, 2, 1000);
light.position.set(sun.position.x, sun.position.y, sun.position.z);
scene.add(light);
scene.add(new THREE.AmbientLight(0x0a0a0a, 20));

function animate()
{
    const now = new Date().getTime() / 1000;

	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );

    let x = 5 * Math.cos(now / 4);
    let z = 5 * Math.sin(now / 4);

    moon.position.set(x, 0, z);
}

animate();