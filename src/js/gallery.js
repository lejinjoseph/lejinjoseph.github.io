var csGallery = {

    glider: null,

    galleryVideos: {},

    init: function () {
        csGallery.glider = new Glider(document.querySelector('#liveSlider'), {
            slidesToShow: 'auto',
            slidesToScroll: 'auto',
            itemWidth: 230,
            draggable: true,
            dots: '.dots',
            arrows: {
                prev: '.glider-prev',
                next: '.glider-next'
            },
            responsive: [
                {
                    breakpoint: 400,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                    }
                }
            ]
        })
    },

    validateAndVideoToGallery: function (cacheObj) {
        var channelId = cacheObj.channelKey.channelId;
        var streamId = cacheObj.channelKey.streamId;
        var metadata = csVideo.liveVideoCache[channelId]["metadata"] || null;
        var title = metadata ? metadata.title : "";

        var galleryObj = {
            channelTitle: title,
            videoTitle: cacheObj.title,
            thumbnail: cacheObj.thumbnail,
            elapsedMins: csTimeZone.minutesDiffFromNow(cacheObj.actualStartTime, 'utc')
        };

        if (csGallery.galleryVideos[streamId]) {
            csGallery.updateVideo(galleryObj);
        } else {
            csGallery.addVideo(galleryObj);
        }

        csGallery.galleryVideos[streamId] = galleryObj;
    },

    addVideo: function (galleryObj) {
        var item = csGallery.createGalleryHtml(galleryObj);
        console.log(item);
        //csGallery.glider.addItem(item);
    },

    createGalleryHtml: function (galleryObj) {
        var html = `<div>
                        <div class="thumb">
                        <img src="${galleryObj.thumbnail}" alt="">
                        <h5>${galleryObj.channelTitle}</h5>
                        <p>${galleryObj.videoTitle}</p>
                        <p class="live">
                            <span>LIVE</span>
                        </p>
                        </div>
                    </div>`;
        return $(html);
    }
};