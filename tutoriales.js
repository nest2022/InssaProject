let videoOverlay = null;
let videoIframe = null;

function createVideoOverlay() {
    if (videoOverlay) {
        return;
    }

    videoOverlay = document.createElement('div');
    videoOverlay.id = 'video-overlay';
    videoOverlay.classList.add('video-overlay-container', 'hidden');

    videoOverlay.innerHTML = `
        <div class="video-header">
            <button class="close-video-button" id="close-video-overlay">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="video-content">
            <iframe id="video-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    `;

    document.body.appendChild(videoOverlay);

    document.getElementById('close-video-overlay').addEventListener('click', hideVideo);
    videoIframe = document.getElementById('video-iframe');

    console.log("Overlay de video creado e inicializado.");
}

export function showVideo(videoUrl) {
    if (!videoOverlay) {
        createVideoOverlay();
    }

    stopCurrentVideo();
    
    const urlWithParams = `${videoUrl}?enablejsapi=1&autoplay=1`;
    videoIframe.src = urlWithParams;
    videoOverlay.classList.remove('hidden');
    console.log(`Video '${videoUrl}' cargado y visible.`);
}

export function hideVideo() {
    if (videoOverlay && !videoOverlay.classList.contains('hidden')) {
        stopCurrentVideo();
        videoOverlay.classList.add('hidden');
        console.log("Overlay de video oculto.");
    }
}

function stopCurrentVideo() {
    if (videoIframe?.src) {
        const baseUrl = videoIframe.src.split('?')[0];
        videoIframe.src = baseUrl;
        console.log("Video actual detenido.");
    }
}

document.addEventListener('DOMContentLoaded', createVideoOverlay);
