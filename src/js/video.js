jQuery(document).ready(function ($) {
    csVideo.registerEvents();
});

var csVideo = {

    videoModal: null,

    registerEvents: function () {

        csVideo.videoModal = $("#videoModal");

        $("body").on("click", "button.watchStream", csVideo.onWatch);
    },

    parseUrl: function (url) {
        var anchor = document.createElement("a");
        anchor.href = url;
        return anchor;
    },

    /**
     * Understand your channel URLs: https://support.google.com/youtube/answer/6180214?hl=en
     */
    getYoutubeChannelName: function (videoUrl) {
        var path = csVideo.parseUrl(videoUrl).pathname;
        return path.substr(path.lastIndexOf('/') + 1);
    },

    getYoutubeLiveStreamUrl: function (videoUrl, success, fail) {
        var channel = csVideo.getYoutubeChannelName(videoUrl);
        var liveStreamUrl = null;
        if (channel.length) {
            console.log("Youtube API to fetch Live stream url from: " + channel);
            /**
             * Youtube API implementation - to do
             */
            liveStreamUrl = 'https://www.youtube.com/embed/YE7VzlLtp-4';
            if (liveStreamUrl) {
                csVideo.loadLiveStream(liveStreamUrl)
            }
            else {
                csVideo.showChannelBtn(videoUrl);
            }
        }
    },

    onWatch: function ($e) {
        var videoUrl = $(this).attr("data-video-url");
        var videoTitle = $(this).attr("data-video-title");
        if (csVideo.parseUrl(videoUrl).hostname.includes('youtube.com')) {
            csVideo.openYoutubeModal(videoUrl, videoTitle);
        }
        else {
            window.open(videoUrl, "_blank");
        }
    },

    loadLiveStream: function (liveStreamUrl) {
        $("#videoSpinner").removeClass('d-flex').hide();
        $("#ytPlayer").attr("src", liveStreamUrl);
    },

    showChannelBtn: function (videoUrl) {
        $("#videoSpinner").removeClass('d-flex').hide();
        $("#ytPlayer").hide();
        alert("Youtube Channel: " + videoUrl);

    },

    openYoutubeModal: function (url, title) {
        csVideo.videoModal.find("#videoModalLabel").text(title);
        csVideo.videoModal.modal("show");
        csVideo.getYoutubeLiveStreamUrl(url);
    }
};