var csGallery = {

    glider: null,

    galleryVideos: {},

    searchCardVisible: true,

    init: function () {

        $(".glider-prev, .glider-next").show();
        $("#liveGallery").on("click", ".thumb:not(.search)", csGallery.thumbnailClicked);

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
            channelId: channelId,
            channelTitle: title,
            videoTitle: cacheObj.title,
            thumbnail: cacheObj.thumbnail,
            elapsedMins: csTimeZone.minutesDiffFromNow(cacheObj.actualStartTime, 'utc')
        };

        if (csGallery.galleryVideos[streamId]) {
            csGallery.updateVideo(streamId, galleryObj);
        } else {
            csGallery.addVideo(streamId, galleryObj);
        }

        csGallery.galleryVideos[streamId] = galleryObj;
    },

    addVideo: function (streamId, galleryObj) {

        if (csGallery.searchCardVisible) {
            csGallery.init();
            csGallery.glider.removeItem(0);
            csGallery.searchCardVisible = false;
        }

        var item = csGallery.createGalleryHtml(streamId, galleryObj);
        csGallery.glider.addItem(item);
    },

    updateVideo: function (streamId, galleryObj) {
        console.log("Updating gallery video: " + streamId);
    },

    createGalleryHtml: function (streamId, galleryObj) {
        var html = `<div>
                        <div class="thumb" data-stream-id="${streamId}" data-channel-id="${galleryObj.channelId}">
                        <img src="${galleryObj.thumbnail}" alt="">
                        <h5>${galleryObj.channelTitle}</h5>
                        <p>${galleryObj.videoTitle}</p>
                        <p class="live">
                            <span>LIVE</span>
                        </p>
                        </div>
                    </div>`;
        return $(html)[0]; //get native node object
    },

    thumbnailClicked: function () {
        var streamId = $(this).data('streamId');
        csVideo.openYoutubeModal();
        csVideo.showYoutubeLive(streamId);
    }
};