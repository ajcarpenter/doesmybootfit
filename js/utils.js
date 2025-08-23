export function clamp(value, min, max) { 
    return Math.max(min, Math.min(max, value)); 
}

export function toRad(degrees) { 
    return (degrees * Math.PI) / 180; 
}

export function createTextSprite(message, parameters) {
    const fontface = parameters.fontface || 'Arial';
    const fontsize = parameters.fontsize || 18;
    const textColor = parameters.textColor || { r: 255, g: 255, b: 255, a: 1.0 };
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `Bold ${fontsize}px ${fontface}`;
    const metrics = context.measureText(message);
    canvas.width = metrics.width;
    canvas.height = fontsize * 1.4;
    context.font = `Bold ${fontsize}px ${fontface}`;
    context.fillStyle = `rgba(${textColor.r}, ${textColor.g}, ${textColor.b}, ${textColor.a})`;
    context.fillText(message, 0, fontsize);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(canvas.width / 5, canvas.height / 5, 1.0);
    return sprite;
}
