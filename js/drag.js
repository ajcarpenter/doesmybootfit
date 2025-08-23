export class DragHandler {
    constructor(sceneManager, objectManager) {
        this.sceneManager = sceneManager;
        this.objectManager = objectManager;
        this.isDragging = false;
        this.dragOffset = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.activeObjectId = null;
        this.sceneObjects = [];
        this.car = null;
        this.getCarByKey = null;
        this.applyStateToObject = null;
        this.checkAllCollisionsAndFit = null;
        this.updateUIFromState = null;
        this.saveState = null;
    }

    setup(activeObjectId, sceneObjects, car, getCarByKey, applyStateToObject, checkAllCollisionsAndFit, updateUIFromState, saveState) {
        this.activeObjectId = activeObjectId;
        this.sceneObjects = sceneObjects;
        this.car = car;
        this.getCarByKey = getCarByKey;
        this.applyStateToObject = applyStateToObject;
        this.checkAllCollisionsAndFit = checkAllCollisionsAndFit;
        this.updateUIFromState = updateUIFromState;
        this.saveState = saveState;

        const canvas = this.sceneManager.getRenderer().domElement;
        canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
    }

    onPointerDown(event) {
        const activeObj = this.sceneObjects.find(o => o.id === this.activeObjectId);
        if (!activeObj) return;

        const rect = this.sceneManager.getRenderer().domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());
        const intersects = this.raycaster.intersectObject(activeObj.mesh);
        
        if (intersects.length > 0) {
            this.isDragging = true;
            this.sceneManager.getControls().enabled = false;
            
            const groundPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.plane, groundPoint)) {
                this.dragOffset.subVectors(activeObj.mesh.position, groundPoint);
            }
        }
    }

    onPointerMove(event) {
        if (!this.isDragging) return;
        
        const activeObj = this.sceneObjects.find(o => o.id === this.activeObjectId);
        if (!activeObj) return;

        const rect = this.sceneManager.getRenderer().domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());
        const groundPoint = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectPlane(this.plane, groundPoint)) {
            activeObj.position.x = groundPoint.x + this.dragOffset.x;
            activeObj.position.z = groundPoint.z + this.dragOffset.z;
            this.applyStateToObject(activeObj, true, this.car, this.getCarByKey);
        }
    }

    onPointerUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.sceneManager.getControls().enabled = true;
        }
    }

    updateActiveObjectId(newId) {
        this.activeObjectId = newId;
    }

    updateSceneObjects(newObjects) {
        this.sceneObjects = newObjects;
    }

    updateCar(newCar) {
        this.car = newCar;
    }
}
