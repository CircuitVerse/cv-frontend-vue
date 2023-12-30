const fadein = () => {
    let loadingIcon = document.querySelector('.loadingIcon');
    loadingIcon.style.transition = 'opacity 0.5s linear';
    loadingIcon.style.opacity = '1';
}

export default fadein;