const fadeout = () => {
    let loadingIcon = document.querySelector('.loadingIcon')
    loadingIcon.style.transition = 'opacity 0.2s';
    loadingIcon.style.opacity = '0';
}

export default fadeout;