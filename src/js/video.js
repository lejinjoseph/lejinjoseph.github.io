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

    getYoutubeLiveStreamUrl: function (videoUrl, videoTitle) {
        var channel = csVideo.getYoutubeChannelName(videoUrl);
        if (channel.length) {
            /**
             * Youtube API implementation - to do
             * on succes: openYoutubeModal(newEmbedUrl, videoTitle)
             * on fail: openLinkNewTab(videoUrl)
             */
            console.log("Youtube API to fetch Live stream url from: " + videoTitle + " : " + channel);
            // for now
            csVideo.openLinkNewTab(videoUrl);
        }
        else {
            csVideo.openLinkNewTab(videoUrl);
        }
    },

    onWatch: function ($e) {
        var videoUrl = $(this).attr("data-video-url");
        var videoTitle = $(this).attr("data-video-title");
        if (csVideo.parseUrl(videoUrl).hostname.includes('youtube.com')) {
            csVideo.getYoutubeLiveStreamUrl(videoUrl, videoTitle);
        }
        else {
            csVideo.openLinkNewTab(videoUrl);
        }
    },

    openLinkNewTab: function (url) {
        console.log("open url in new tab: " + url);
    },

    openYoutubeModal: function (url, title) {
        console.log(url);
        $("#ytPlayer").attr("src", url);
        csVideo.videoModal.modal("show");
    }
};