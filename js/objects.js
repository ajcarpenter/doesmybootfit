import { toRad } from './utils.js';

export class ObjectManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.getScene();
    }

    getObjectWorldBounds(obj) {
        if (!obj || !obj.mesh) {
            return null;
        }
        try {
            obj.mesh.geometry.computeBoundingBox();
            return new THREE.Box3().copy(obj.mesh.geometry.boundingBox).applyMatrix4(obj.mesh.matrixWorld);
        } catch (error) {
            console.error('Error computing bounds:', error);
            return null;
        }
    }

    checkAllCollisionsAndFit(sceneObjects, car, shelfIn, updateFitStatusBadge, saveState) {
        sceneObjects.forEach(obj => obj.isColliding = false);

        // Check object-to-object collisions
        for (let i = 0; i < sceneObjects.length; i++) {
            for (let j = i + 1; j < sceneObjects.length; j++) {
                const obj1 = sceneObjects[i];
                const obj2 = sceneObjects[j];
                const bounds1 = this.getObjectWorldBounds(obj1);
                const bounds2 = this.getObjectWorldBounds(obj2);
                if (bounds1 && bounds2 && bounds1.intersectsBox(bounds2)) {
                    obj1.isColliding = true;
                    obj2.isColliding = true;
                }
            }
        }

        const bootHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;

        // Check fit status for each object
        sceneObjects.forEach(obj => {
            const bounds = this.getObjectWorldBounds(obj);
            if (!bounds) return;
            
            const tolerance = 0.001; 
            const fitsX = bounds.min.x >= -tolerance && bounds.max.x <= car.W + tolerance;
            const fitsY = bounds.min.y >= -tolerance && bounds.max.y <= bootHeight + tolerance;
            const fitsZ = bounds.min.z >= -tolerance && bounds.max.z <= car.D + tolerance;

            let reason = 'Fits', color = 0x21c07a;
            if (obj.isColliding) { 
                reason = 'Colliding'; 
                color = 0xff6b6b; 
            } else if (!fitsX || !fitsZ) { 
                reason = 'Exceeds Bounds'; 
                color = 0xff6b6b; 
            } else if (!fitsY) { 
                reason = 'Too Tall'; 
                color = 0xf1c40f; 
            }
            
            obj.fitStatus = reason;
            obj.mesh.material.color.setHex(color);
        });
        
        updateFitStatusBadge();
        saveState();
    }

    createObjectMesh(itemConfig) {
        const geometry = new THREE.BoxGeometry(itemConfig.L, itemConfig.T, itemConfig.W);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2196f3,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide, // Helps see inside faces
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });
        return new THREE.Mesh(geometry, material);
    }

    recreateMeshes(sceneObjects, getItemByKey) {
        // First, safely remove existing meshes
        sceneObjects.forEach(obj => {
            if (obj.mesh && this.scene) {
                this.scene.remove(obj.mesh);
                if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                if (obj.mesh.material) obj.mesh.material.dispose();
            }
        });
        
        // Then create new meshes
        sceneObjects.forEach(obj => {
            try {
                const config = getItemByKey(obj.itemKey);
                if (config && this.scene) {
                    obj.mesh = this.createObjectMesh(config);
                    this.scene.add(obj.mesh);
                    this.applyStateToObject(obj);
                }
            } catch (error) {
                console.error('Error creating mesh for object:', obj, error);
            }
        });
        // After all meshes are created and positioned, update collision and color state
        if (typeof window.app === 'object' && typeof window.app.checkAllCollisionsAndFit === 'function') {
            window.app.checkAllCollisionsAndFit();
        }
    }

    applyStateToObject(obj, isDrag = false, car, getCarByKey) {
        if (!obj || !obj.mesh) {
            return;
        }

        obj.mesh.rotation.set(toRad(obj.rotation.pitch), toRad(obj.rotation.yaw), toRad(obj.rotation.roll), 'YXZ');
        obj.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        obj.mesh.updateMatrixWorld(true);

        const bounds = this.getObjectWorldBounds(obj);
        if (bounds) {
            if (isDrag) {
                if (bounds.min.x < 0) obj.position.x -= bounds.min.x;
                if (bounds.max.x > car.W) obj.position.x -= (bounds.max.x - car.W);
                if (bounds.min.z < 0) obj.position.z -= bounds.min.z;
                if (bounds.max.z > car.D) obj.position.z -= (bounds.max.z - car.D);
            } else {
                obj.position.y -= bounds.min.y;
            }
        }
        
        obj.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        obj.mesh.updateMatrixWorld(true);
    }

    removeObject(obj) {
        if (obj.mesh && this.scene) {
            this.scene.remove(obj.mesh);
            if (obj.mesh.geometry) obj.mesh.geometry.dispose();
            if (obj.mesh.material) obj.mesh.material.dispose();
        }
    }
    
    updateScene(scene) {
        this.scene = scene;
    }
}
