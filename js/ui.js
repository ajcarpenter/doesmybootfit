export class UIManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // These will be set up by the main app with proper context
    }

    updateFitStatusBadge(sceneObjects, activeObjectId) {
        const badge = document.getElementById('fitStatusBadge');
        const activeObj = sceneObjects.find(o => o.id === activeObjectId);
        
        if (!activeObj) {
            badge.textContent = 'No item';
            badge.className = 'badge';
            return;
        }
        
        badge.textContent = activeObj.fitStatus;
        let colorClass = 'red';
        if (activeObj.fitStatus === 'Fits') colorClass = 'green';
        if (activeObj.fitStatus === 'Too Tall') colorClass = 'yellow';
        badge.className = `badge ${colorClass}`;
    }

    updateBoot(car, shelfIn, updateBootCallback) {
        const shelfToggle = document.getElementById('shelfToggle');
        const hasRemovableShelf = car.H_shelf_in !== car.H_shelf_out;
        
        shelfToggle.disabled = !hasRemovableShelf;
        if (!hasRemovableShelf) {
            shelfIn = true;
        }
        shelfToggle.checked = shelfIn;
        
        const bootHeight = shelfIn ? car.H_shelf_in : car.H_shelf_out;
        document.getElementById('bootWidth').value = car.W;
        document.getElementById('bootDepth').value = car.D;
        document.getElementById('bootHeight').value = bootHeight;
        
        document.getElementById('posXSlider').max = car.W;
        document.getElementById('posZSlider').max = car.D;
        document.getElementById('posYSlider').max = Math.max(car.H_shelf_in, car.H_shelf_out);
        
        updateBootCallback();
    }

    updateActiveItemDimensions(activeObject, getItemByKey, recreateMeshes) {
        if (!activeObject) return;
        
        const item = getItemByKey(activeObject.itemKey);
        item.L = parseFloat(document.getElementById('itemLength').value);
        item.W = parseFloat(document.getElementById('itemWidth').value);
        item.T = parseFloat(document.getElementById('itemThickness').value);
        recreateMeshes();
    }

    updateFromUI(activeObject, fromNumberInput = false, applyStateToObject, checkAllCollisionsAndFit) {
        if (!activeObject) return;
        
        const snap = document.getElementById('snapRotation').checked;
        
        if (fromNumberInput) {
            activeObject.rotation.yaw = parseInt(document.getElementById('yawInput').value) || 0;
            activeObject.rotation.pitch = parseInt(document.getElementById('pitchInput').value) || 0;
            activeObject.rotation.roll = parseInt(document.getElementById('rollInput').value) || 0;
        } else {
            activeObject.position.x = parseFloat(document.getElementById('posXSlider').value);
            activeObject.position.y = parseFloat(document.getElementById('posYSlider').value);
            activeObject.position.z = parseFloat(document.getElementById('posZSlider').value);
            activeObject.rotation.yaw = parseInt(document.getElementById('yawSlider').value) || 0;
            activeObject.rotation.pitch = parseInt(document.getElementById('pitchSlider').value) || 0;
            activeObject.rotation.roll = parseInt(document.getElementById('rollSlider').value) || 0;
        }
        
        if (snap) {
            activeObject.rotation.yaw = Math.round(activeObject.rotation.yaw / 90) * 90;
            activeObject.rotation.pitch = Math.round(activeObject.rotation.pitch / 90) * 90;
            activeObject.rotation.roll = Math.round(activeObject.rotation.roll / 90) * 90;
        }
        
        applyStateToObject(activeObject);
    }

    updateUIFromState(sceneObjects, activeObjectId, userItems, getItemByKey, updateObjectSelector) {
        const controlsSection = document.getElementById('controlsSection');
        const activeObj = sceneObjects.find(o => o.id === activeObjectId);
        const editItemBtn = document.getElementById('editItemBtn');
        const deleteItemBtn = document.getElementById('deleteItemBtn');

        if (!activeObj) {
            controlsSection.style.display = 'none';
            editItemBtn.style.display = 'none';
            deleteItemBtn.style.display = 'none';
            return;
        }
        
        controlsSection.style.display = 'block';
        
        const isCustomItem = !!userItems[activeObj.itemKey];
        editItemBtn.style.display = isCustomItem ? 'block' : 'none';
        deleteItemBtn.style.display = isCustomItem ? 'block' : 'none';
        
        const item = getItemByKey(activeObj.itemKey);
        document.getElementById('activeItemName').textContent = activeObj.name;
        document.getElementById('itemLength').value = item.L;
        document.getElementById('itemWidth').value = item.W;
        document.getElementById('itemThickness').value = item.T;
        document.getElementById('itemLength').readOnly = !isCustomItem;
        document.getElementById('itemWidth').readOnly = !isCustomItem;
        document.getElementById('itemThickness').readOnly = !isCustomItem;

        document.getElementById('posXSlider').value = activeObj.position.x;
        document.getElementById('posYSlider').value = activeObj.position.y;
        document.getElementById('posZSlider').value = activeObj.position.z;
        document.getElementById('posXValue').textContent = activeObj.position.x.toFixed(1);
        document.getElementById('posYValue').textContent = activeObj.position.y.toFixed(1);
        document.getElementById('posZValue').textContent = activeObj.position.z.toFixed(1);
        document.getElementById('yawSlider').value = activeObj.rotation.yaw;
        document.getElementById('pitchSlider').value = activeObj.rotation.pitch;
        document.getElementById('rollSlider').value = activeObj.rotation.roll;
        document.getElementById('yawInput').value = activeObj.rotation.yaw;
        document.getElementById('pitchInput').value = activeObj.rotation.pitch;
        document.getElementById('rollInput').value = activeObj.rotation.roll;
    }

    setupTypeaheadObjectSelector(sceneObjects, activeObjectId, setActiveObject) {
        const input = document.getElementById('objectSelectorInput');
        const dropdown = document.getElementById('objectSelectorDropdown');
        let options = sceneObjects.map(obj => ({ id: obj.id, name: obj.name }));
        let activeIndex = -1;
        function renderDropdown(filtered) {
            dropdown.innerHTML = '';
            if (!filtered.length) {
                dropdown.classList.remove('active');
                return;
            }
            filtered.forEach((obj, idx) => {
                const div = document.createElement('div');
                div.className = 'typeahead-option' + (idx === activeIndex ? ' active' : '');
                div.textContent = obj.name;
                div.onclick = () => {
                    input.value = obj.name;
                    dropdown.classList.remove('active');
                    setActiveObject(obj.id);
                };
                dropdown.appendChild(div);
            });
            dropdown.classList.add('active');
        }
        function filterOptions(val) {
            return options.filter(o => o.name.toLowerCase().includes(val.toLowerCase()));
        }
        input.oninput = () => {
            activeIndex = -1;
            renderDropdown(filterOptions(input.value));
        };
        input.onfocus = () => {
            renderDropdown(filterOptions(input.value));
        };
        input.onblur = () => {
            setTimeout(() => dropdown.classList.remove('active'), 100);
        };
        input.onkeydown = (e) => {
            let filtered = filterOptions(input.value);
            if (!filtered.length) return;
            if (e.key === 'ArrowDown') {
                activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                activeIndex = Math.max(activeIndex - 1, 0);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                input.value = filtered[activeIndex].name;
                dropdown.classList.remove('active');
                setActiveObject(filtered[activeIndex].id);
                e.preventDefault();
            }
        };
        // Set initial value
        const activeObj = sceneObjects.find(o => o.id === activeObjectId);
        input.value = activeObj ? activeObj.name : '';
    }

    setupTypeaheadCarSelector(presetCars, userCars, selectCarCallback, activeCarKey) {
        const input = document.getElementById('carSelectorInput');
        const dropdown = document.getElementById('carSelectorDropdown');
        let options = [
            ...Object.keys(presetCars).map(key => ({ key, name: presetCars[key].name })),
            ...Object.keys(userCars).map(key => ({ key, name: userCars[key].name }))
        ];
        let activeIndex = -1;
        function renderDropdown(filtered) {
            dropdown.innerHTML = '';
            if (!filtered.length) {
                dropdown.classList.remove('active');
                return;
            }
            filtered.forEach((car, idx) => {
                const div = document.createElement('div');
                div.className = 'typeahead-option' + (idx === activeIndex ? ' active' : '');
                div.textContent = car.name;
                div.onclick = () => {
                    input.value = car.name;
                    dropdown.classList.remove('active');
                    selectCarCallback(car.key);
                };
                dropdown.appendChild(div);
            });
            dropdown.classList.add('active');
        }
        function filterOptions(val) {
            return options.filter(o => o.name.toLowerCase().includes(val.toLowerCase()));
        }
        input.oninput = () => {
            activeIndex = -1;
            renderDropdown(filterOptions(input.value));
        };
        input.onfocus = () => {
            renderDropdown(filterOptions(input.value));
        };
        input.onblur = () => {
            setTimeout(() => dropdown.classList.remove('active'), 100);
        };
        input.onkeydown = (e) => {
            let filtered = filterOptions(input.value);
            if (!filtered.length) return;
            if (e.key === 'ArrowDown') {
                activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                activeIndex = Math.max(activeIndex - 1, 0);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                input.value = filtered[activeIndex].name;
                dropdown.classList.remove('active');
                selectCarCallback(filtered[activeIndex].key);
                e.preventDefault();
            }
        };
        // Set initial value
        const activeCar = options.find(o => o.key === activeCarKey);
        input.value = activeCar ? activeCar.name : '';
    }

    setupAddItemTypeahead(presetItems, userItems, addItemCallback) {
        const input = document.getElementById('addItemTypeaheadInput');
        const dropdown = document.getElementById('addItemTypeaheadDropdown');
        let options = [
            ...Object.keys(presetItems).map(key => ({ key, name: presetItems[key].name })),
            ...Object.keys(userItems).map(key => ({ key, name: userItems[key].name }))
        ];
        let activeIndex = -1;
        function renderDropdown(filtered) {
            dropdown.innerHTML = '';
            if (!filtered.length) {
                dropdown.classList.remove('active');
                return;
            }
            filtered.forEach((obj, idx) => {
                const div = document.createElement('div');
                div.className = 'typeahead-option' + (idx === activeIndex ? ' active' : '');
                div.textContent = obj.name;
                div.onclick = () => {
                    input.value = '';
                    dropdown.classList.remove('active');
                    addItemCallback(obj.key);
                };
                dropdown.appendChild(div);
            });
            dropdown.classList.add('active');
        }
        function filterOptions(val) {
            return options.filter(o => o.name.toLowerCase().includes(val.toLowerCase()));
        }
        input.oninput = () => {
            activeIndex = -1;
            renderDropdown(filterOptions(input.value));
        };
        input.onfocus = () => {
            renderDropdown(filterOptions(input.value));
        };
        input.onblur = () => {
            setTimeout(() => dropdown.classList.remove('active'), 100);
        };
        input.onkeydown = (e) => {
            let filtered = filterOptions(input.value);
            if (!filtered.length) return;
            if (e.key === 'ArrowDown') {
                activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                activeIndex = Math.max(activeIndex - 1, 0);
                renderDropdown(filtered);
                e.preventDefault();
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                input.value = '';
                dropdown.classList.remove('active');
                addItemCallback(filtered[activeIndex].key);
                e.preventDefault();
            }
        };
        input.value = '';
    }

    updateObjectSelector(sceneObjects, activeObjectId, setActiveObject) {
        const selector = document.getElementById('objectSelector');
        selector.innerHTML = '';
        if (sceneObjects.length === 0) {
            selector.innerHTML = '<option>No items in boot</option>';
            selector.disabled = true;
        } else {
            sceneObjects.forEach(obj => {
                const option = document.createElement('option');
                option.value = obj.id;
                option.textContent = obj.name;
                if (obj.id === activeObjectId) option.selected = true;
                selector.appendChild(option);
            });
            selector.disabled = false;
        }
        selector.onchange = (e) => {
            const id = e.target.value;
            if (setActiveObject) setActiveObject(id);
        };
    }

    populateCarSelector(presetCars, userCars, selectCarCallback) {
        const selector = document.getElementById('carSelector');
        selector.innerHTML = '';
        
        const presetGroup = document.createElement('optgroup');
        presetGroup.label = 'Presets';
        Object.keys(presetCars).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = presetCars[key].name;
            presetGroup.appendChild(option);
        });
        selector.appendChild(presetGroup);

        const customGroup = document.createElement('optgroup');
        customGroup.label = 'My Cars';
        Object.keys(userCars).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = userCars[key].name;
            customGroup.appendChild(option);
        });
        if (Object.keys(userCars).length > 0) {
            selector.appendChild(customGroup);
        }
    }

    populateAddItemButtons(presetItems, userItems, addItemCallback) {
        const container = document.getElementById('add-item-buttons');
        container.innerHTML = '';
        
        Object.keys(presetItems).forEach(key => {
            const button = document.createElement('button');
            button.className = 'btn primary';
            button.textContent = `+ ${presetItems[key].name}`;
            button.addEventListener('click', () => addItemCallback(key));
            container.appendChild(button);
        });
        
        Object.keys(userItems).forEach(key => {
            const button = document.createElement('button');
            button.className = 'btn';
            button.textContent = `+ ${userItems[key].name}`;
            button.addEventListener('click', () => addItemCallback(key));
            container.appendChild(button);
        });
    }

    showItemModal(id = null, userItems, populateAddItemButtons, recreateMeshes) {
        const modal = document.getElementById('itemModal');
        const title = document.getElementById('itemModalTitle');
        const form = document.getElementById('itemForm');
        form.reset();
        document.getElementById('itemId').value = id || '';

        if (id) {
            title.textContent = 'Edit Custom Item';
            const item = userItems[id];
            document.getElementById('itemName').value = item.name;
            document.getElementById('modalItemL').value = item.L;
            document.getElementById('modalItemW').value = item.W;
            document.getElementById('modalItemT').value = item.T;
        } else {
            title.textContent = 'Add Custom Item';
        }
        modal.style.display = 'block';
    }

    hideItemModal() {
        document.getElementById('itemModal').style.display = 'none';
    }

    showCarModal(id = null, userCars, populateCarSelector, selectCar) {
        const modal = document.getElementById('carModal');
        const title = document.getElementById('carModalTitle');
        const form = document.getElementById('carForm');
        if (!id) form.reset(); // Only reset when adding a new car
        document.getElementById('carId').value = id || '';

        if (id) {
            title.textContent = 'Edit Custom Car';
            const car = userCars[id];
            document.getElementById('carName').value = car.name;
            document.getElementById('modalCarW').value = car.W;
            document.getElementById('modalCarD').value = car.D;
            const hasShelf = car.H_shelf_in !== car.H_shelf_out;
            document.getElementById('modalCarHasShelf').checked = hasShelf;
            document.getElementById('modalCarHShelfIn').value = car.H_shelf_in;
            document.getElementById('modalCarHShelfOut').value = car.H_shelf_out;
        } else {
            title.textContent = 'Add Custom Car';
        }
        this.toggleShelfHeightInput();
        modal.style.display = 'block';
    }

    hideCarModal() {
        document.getElementById('carModal').style.display = 'none';
    }

    toggleShelfHeightInput() {
        const hasShelf = document.getElementById('modalCarHasShelf').checked;
        document.getElementById('shelfOutGroup').style.display = hasShelf ? 'block' : 'none';
        document.getElementById('shelfInGroup').querySelector('label').textContent = hasShelf ? 'Height (Shelf In)' : 'Height';
    }

    handleItemForm(e, userItems, populateAddItemButtons, recreateMeshes, hideItemModal) {
        e.preventDefault();
        const id = document.getElementById('itemId').value;
        const key = id || `user_${Date.now()}`;
        
        userItems[key] = {
            name: document.getElementById('itemName').value,
            L: parseFloat(document.getElementById('modalItemL').value),
            W: parseFloat(document.getElementById('modalItemW').value),
            T: parseFloat(document.getElementById('modalItemT').value),
        };
        
        populateAddItemButtons();
        recreateMeshes();
        hideItemModal();
    }

    handleCarForm(e, userCars, populateCarSelector, selectCar, hideCarModal) {
        e.preventDefault();
        const id = document.getElementById('carId').value;
        const key = id || `user_${Date.now()}`;
        const hasShelf = document.getElementById('modalCarHasShelf').checked;
        const shelfInHeight = parseFloat(document.getElementById('modalCarHShelfIn').value);
        
        userCars[key] = {
            name: document.getElementById('carName').value,
            W: parseFloat(document.getElementById('modalCarW').value),
            D: parseFloat(document.getElementById('modalCarD').value),
            H_shelf_in: shelfInHeight,
            H_shelf_out: hasShelf ? parseFloat(document.getElementById('modalCarHShelfOut').value) : shelfInHeight,
        };
        
        populateCarSelector();
        document.getElementById('carSelector').value = key;
        selectCar(key);
        hideCarModal();
    }
}
