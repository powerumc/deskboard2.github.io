// Video Lazy Loading
document.addEventListener('DOMContentLoaded', () => {
    const posterMediaQuery = window.matchMedia('(max-width: 720px)');
    const updatePoster = (video) => {
        const mobilePoster = video.dataset.posterMobile;
        const desktopPoster = video.dataset.poster;
        if (posterMediaQuery.matches && mobilePoster) {
            video.poster = mobilePoster;
        } else if (desktopPoster) {
            video.poster = desktopPoster;
        }
    };

    const videoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                
                if (!video.dataset.loaded) {
                    const sources = video.querySelectorAll('source');
                    sources.forEach(source => {
                        if (source.dataset.src) {
                            source.src = source.dataset.src;
                        }
                    });
                    video.load();
                    video.dataset.loaded = 'true';
                }

                if (video.paused) {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                }
                
                video.classList.add('is-playing');
            } else {
                const video = entry.target;
                if (!video.paused && video.dataset.loaded) {
                    video.pause();
                }
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading slightly before video enters viewport
        threshold: 0.1
    });

    // Find all lazy videos
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    lazyVideos.forEach(video => {
        updatePoster(video);
        videoObserver.observe(video);
    });

    posterMediaQuery.addEventListener('change', () => {
        lazyVideos.forEach(updatePoster);
    });
});
