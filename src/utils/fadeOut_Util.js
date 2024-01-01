export function fadeOut(element, duration = 400) {
    element.animate({
        opacity: 0
    }, {
        duration: duration,
        easing: "linear",
        iterations: 1,
        fill: "both"
    })
        .onfinish = function () {
            element.style.display = "none";
        }
}