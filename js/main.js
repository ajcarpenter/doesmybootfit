import { PRESET_CARS } from '../config/cars.js';
import { PRESET_ITEMS } from '../config/items.js';
import { SceneManager } from './scene.js';
import { ObjectManager } from './objects.js';
import { DragHandler } from './drag.js';
import { UIManager } from './ui.js';



class BootFitApp {
    constructor() {
        this.appState = {
            carKey: 'ENYAQ',
            shelfIn: true,
            sceneObjects: [],
            activeObjectId: null,
            userCars: {},
            userItems: {}
        };

        this.sceneManager = new SceneManager();
        this.objectManager = new ObjectManager(this.sceneManager);
        this.dragHandler = new DragHandler(this.sceneManager, this.objectManager);
        this.uiManager = new UIManager();

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.sceneManager.onWindowResize());
        window.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        const canvas = document.getElementById('canvas');
        this.sceneManager.init(canvas);
        requestAnimationFrame(() => {
            this.objectManager.updateScene(this.sceneManager.getScene());
            this.loadState();
            this.populateCarSelector();
            this.setupAddItemTypeahead();
            this.sceneManager.animate();
            this.setupDragHandlers();
            this.setupFormEventListeners();
        });
    }

    setupAddItemTypeahead() {
        this.uiManager.setupAddItemTypeahead(
            PRESET_ITEMS,
            this.appState.userItems,
            this.addItem.bind(this)
        );
    }

    setupDragHandlers() {
        this.dragHandler.setup(
            this.appState.activeObjectId,
            this.appState.sceneObjects,
            this.getCarByKey(this.appState.carKey),
            this.getCarByKey.bind(this),
            this.applyStateToObject.bind(this),
            this.checkAllCollisionsAndFit.bind(this),
            this.updateUIFromState.bind(this),
            this.saveState.bind(this)
        );
    }

    setupFormEventListeners() {
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            this.uiManager.handleItemForm(
                e,
                this.appState.userItems,
                this.setupAddItemTypeahead.bind(this),
                this.recreateMeshes.bind(this),
                this.hideItemModal.bind(this)
            );
        });
        
        document.getElementById('carForm').addEventListener('submit', (e) => {
            this.uiManager.handleCarForm(e, this.appState.userCars, this.populateCarSelector.bind(this), this.selectCar.bind(this), this.hideCarModal.bind(this));
        });
    }

    getCarByKey(key) {
        if (PRESET_CARS[key]) return PRESET_CARS[key];
        return this.appState.userCars[key];
    }

    getItemByKey(key) {
        if (PRESET_ITEMS[key]) return PRESET_ITEMS[key];
        return this.appState.userItems[key];
    }

    addItem(itemKey) {
        const id = Date.now();
        const config = this.getItemByKey(itemKey);
        const car = this.getCarByKey(this.appState.carKey);
        
        const newObject = {
            id: id,
            itemKey: itemKey,
            name: `${config.name} #${this.appState.sceneObjects.length + 1}`,
            position: { x: car.W / 2, y: 0, z: car.D / 2 },
            rotation: { yaw: 0, pitch: 0, roll: 0 },
            isColliding: false,
            fitStatus: 'Checking...'
        };
        
        this.appState.sceneObjects.push(newObject);
        this.recreateMeshes();
        this.setActiveObject(id);
        this.centerActiveObject();
    }

    removeActiveItem() {
        if (!this.appState.activeObjectId) return;
        
        const index = this.appState.sceneObjects.findIndex(o => o.id === this.appState.activeObjectId);
        if (index > -1) {
            this.objectManager.removeObject(this.appState.sceneObjects[index]);
            this.appState.sceneObjects.splice(index, 1);
            const newActiveId = this.appState.sceneObjects.length > 0 ? this.appState.sceneObjects[0].id : null;
            this.setActiveObject(newActiveId);
        }
        this.checkAllCollisionsAndFit();
    }

    setActiveObject(id) {
        this.appState.activeObjectId = id ? parseInt(id) : null;
        this.dragHandler.updateActiveObjectId(this.appState.activeObjectId);
        this.updateObjectSelector();
        this.updateUIFromState();
        this.checkAllCollisionsAndFit();
    }

    recreateMeshes() {
        this.objectManager.recreateMeshes(this.appState.sceneObjects, this.getItemByKey.bind(this));
    }

    checkAllCollisionsAndFit() {
        const car = this.getCarByKey(this.appState.carKey);
        this.objectManager.checkAllCollisionsAndFit(
            this.appState.sceneObjects,
            car,
            this.appState.shelfIn,
            () => this.uiManager.updateFitStatusBadge(this.appState.sceneObjects, this.appState.activeObjectId),
            this.saveState.bind(this)
        );
    }

    updateBoot() {
        const car = this.getCarByKey(this.appState.carKey);
        this.uiManager.updateBoot(car, this.appState.shelfIn, () => {
            this.sceneManager.createBoot(car, this.appState.shelfIn);
            this.checkAllCollisionsAndFit();
        });
    }

    updateBootManual() {
        const car = this.getCarByKey(this.appState.carKey);
        car.W = parseFloat(document.getElementById('bootWidth').value);
        car.D = parseFloat(document.getElementById('bootDepth').value);
        this.updateBoot();
    }

    updateActiveItemDimensions() {
        const activeObj = this.appState.sceneObjects.find(o => o.id === this.appState.activeObjectId);
        this.uiManager.updateActiveItemDimensions(activeObj, this.getItemByKey.bind(this), this.recreateMeshes.bind(this));
    }

    updateFromUI(fromNumberInput = false) {
        const activeObj = this.appState.sceneObjects.find(o => o.id === this.appState.activeObjectId);
        this.uiManager.updateFromUI(activeObj, fromNumberInput, this.applyStateToObject.bind(this), this.checkAllCollisionsAndFit.bind(this));
    }

    applyStateToObject(obj, isDrag = false) {
        if (!obj || !obj.mesh) return;
        
        const car = this.getCarByKey(this.appState.carKey);
        this.objectManager.applyStateToObject(obj, isDrag, car, this.getCarByKey.bind(this));
        
        if (obj.id === this.appState.activeObjectId) {
            this.updateUIFromState();
        }
        this.checkAllCollisionsAndFit();
    }

    updateUIFromState() {
        this.uiManager.updateUIFromState(
            this.appState.sceneObjects,
            this.appState.activeObjectId,
            this.appState.userItems,
            this.getItemByKey.bind(this),
            this.updateObjectSelector.bind(this)
        );
    }

    updateObjectSelector() {
        this.uiManager.updateObjectSelector(
            this.appState.sceneObjects,
            this.appState.activeObjectId,
            this.setActiveObject.bind(this)
        );
    }

    populateCarSelector() {
        this.uiManager.setupTypeaheadCarSelector(
            PRESET_CARS,
            this.appState.userCars,
            this.selectCar.bind(this),
            this.appState.carKey
        );
    }

    populateAddItemButtons() {
        this.uiManager.populateAddItemButtons(PRESET_ITEMS, this.appState.userItems, (itemKey) => this.addItem(itemKey));
    }

    selectCar(carKey) {
        this.appState.carKey = carKey;
        const isCustom = !!this.appState.userCars[carKey];
        document.getElementById('editCarBtn').style.display = isCustom ? 'block' : 'none';
        document.getElementById('deleteCarBtn').style.display = isCustom ? 'block' : 'none';
        document.getElementById('bootWidth').readOnly = !isCustom;
        document.getElementById('bootDepth').readOnly = !isCustom;
        this.updateBoot();
    }

    centerActiveObject() {
        const activeObj = this.appState.sceneObjects.find(o => o.id === this.appState.activeObjectId);
        if (!activeObj) return;
        
        const car = this.getCarByKey(this.appState.carKey);
        activeObj.position.x = car.W / 2;
        activeObj.position.z = car.D / 2;
        activeObj.rotation = { yaw: 0, pitch: 0, roll: 0 };
        this.applyStateToObject(activeObj);
    }

    toggleShelf() {
        this.appState.shelfIn = document.getElementById('shelfToggle').checked;
        this.updateBoot();
    }

    showItemModal(id = null) {
        this.uiManager.showItemModal(id, this.appState.userItems, this.populateAddItemButtons.bind(this), this.recreateMeshes.bind(this));
    }

    hideItemModal() {
        this.uiManager.hideItemModal();
    }

    showCarModal(id = null) {
        this.uiManager.showCarModal(id, this.appState.userCars, this.populateCarSelector.bind(this), this.selectCar.bind(this));
    }

    hideCarModal() {
        this.uiManager.hideCarModal();
    }

    toggleShelfHeightInput() {
        this.uiManager.toggleShelfHeightInput();
    }

    editActiveItemPreset() {
        const activeObj = this.appState.sceneObjects.find(o => o.id === this.appState.activeObjectId);
        if (activeObj && this.appState.userItems[activeObj.itemKey]) {
            this.showItemModal(activeObj.itemKey);
        }
    }

    deleteActiveItemPreset() {
        const activeObj = this.appState.sceneObjects.find(o => o.id === this.appState.activeObjectId);
        if (activeObj && this.appState.userItems[activeObj.itemKey]) {
            const keyToDelete = activeObj.itemKey;
            delete this.appState.userItems[keyToDelete];
            // Remove all objects with this itemKey and their meshes
            this.appState.sceneObjects.forEach(obj => {
                if (obj.itemKey === keyToDelete && obj.mesh && this.objectManager.scene) {
                    this.objectManager.scene.remove(obj.mesh);
                    if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                    if (obj.mesh.material) obj.mesh.material.dispose();
                }
            });
            this.appState.sceneObjects = this.appState.sceneObjects.filter(o => o.itemKey !== keyToDelete);
            this.recreateMeshes();
            this.setupAddItemTypeahead();
            this.setActiveObject(this.appState.sceneObjects.length > 0 ? this.appState.sceneObjects[0].id : null);
        }
    }

    editActiveCar() {
        if (this.appState.userCars[this.appState.carKey]) {
            this.showCarModal(this.appState.carKey);
        }
    }

    deleteActiveCar() {
        const carKey = this.appState.carKey;
        if (this.appState.userCars[carKey]) {
            delete this.appState.userCars[carKey];
            this.populateCarSelector();
            this.selectCar('ENYAQ');
            document.getElementById('carSelector').value = 'ENYAQ';
        }
    }

    saveState() {
        const stateToSave = {
            ...this.appState,
            sceneObjects: this.appState.sceneObjects.map(obj => ({
                id: obj.id, name: obj.name, itemKey: obj.itemKey, position: obj.position, rotation: obj.rotation,
            }))
        };
        localStorage.setItem('bootFitCheckerState', JSON.stringify(stateToSave));
    }

    loadState() {
        const savedStateJSON = localStorage.getItem('bootFitCheckerState');
        if (savedStateJSON) {
            const loaded = JSON.parse(savedStateJSON);
            this.appState = { ...this.appState, ...loaded };
        }
        
        if (!this.getCarByKey(this.appState.carKey)) {
            this.appState.carKey = 'ENYAQ';
        }

        this.appState.sceneObjects.forEach(o => o.mesh = null);

        this.updateBoot();
        this.recreateMeshes();
        this.updateObjectSelector();
        this.updateUIFromState();
    }

    resetState() {
        localStorage.removeItem('bootFitCheckerState');
        location.reload();
    }
}

// Initialize the application and make it globally accessible
window.app = new BootFitApp();
