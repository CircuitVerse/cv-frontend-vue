export function fadeIn(element, duration = 400) {
    element.style.opacity = 0;
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) {
            startTime = currentTime;
        }

        const elapsedTime = currentTime - startTime;
        const opacity = elapsedTime / duration;

        element.style.opacity = opacity > 1 ? 1 : opacity;

        if (elapsedTime < duration) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}