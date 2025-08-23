import { createTextSprite } from './utils.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.bootMesh = null;
        this.gridHelper = null;
        this.labelsGroup = null;
    }

    init(canvas) {
        const container = canvas.parentElement;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d0f14);
        
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
        this.camera.position.set(150, 150, 180);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 300, 200);
        this.scene.add(directionalLight);
    }

    createBoot(car, shelfIn) {
        const bootHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
        
        if (this.bootMesh) this.scene.remove(this.bootMesh);
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        if (this.labelsGroup) this.scene.remove(this.labelsGroup);
        
        const group = new THREE.Group();
        const bootGeometry = new THREE.BoxGeometry(car.W, bootHeight, car.D);
        const edges = new THREE.EdgesGeometry(bootGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x3f3f46 });
        const bootWireframe = new THREE.LineSegments(edges, lineMaterial);
        bootWireframe.position.set(car.W / 2, bootHeight / 2, car.D / 2);
        group.add(bootWireframe);
        
        const floorGeometry = new THREE.PlaneGeometry(car.W, car.D);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(car.W / 2, 0.01, car.D / 2);
        group.add(floor);
        
        this.labelsGroup = new THREE.Group();
        const labelParams = { fontsize: 24, textColor: { r: 150, g: 150, b: 150, a: 1.0 } };
        const frontLabel = createTextSprite("Front", labelParams);
        frontLabel.position.set(car.W / 2, bootHeight + 10, car.D);
        this.labelsGroup.add(frontLabel);
        const backLabel = createTextSprite("Back", labelParams);
        backLabel.position.set(car.W / 2, bootHeight + 10, 0);
        this.labelsGroup.add(backLabel);
        const leftLabel = createTextSprite("Left", labelParams);
        leftLabel.position.set(0, bootHeight + 10, car.D / 2);
        this.labelsGroup.add(leftLabel);
        const rightLabel = createTextSprite("Right", labelParams);
        rightLabel.position.set(car.W, bootHeight + 10, car.D / 2);
        this.labelsGroup.add(rightLabel);
        this.scene.add(this.labelsGroup);
        
        this.gridHelper = new THREE.GridHelper(Math.max(car.W, car.D) * 1.2, 20, 0x2b3040, 0x1f2330);
        this.gridHelper.position.set(car.W / 2, 0, car.D / 2);
        this.scene.add(this.gridHelper);
        
        this.bootMesh = group;
        this.scene.add(this.bootMesh);
        this.controls.target.set(car.W / 2, 0, car.D / 2);
    }

    onWindowResize() {
        const container = document.querySelector('.canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getControls() {
        return this.controls;
    }
}
