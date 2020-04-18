jQuery(document).ready(function ($) {
    csTimeZone.registerEvents();
    csTimeZone.createDropDown('#timeZones');
});

var csTimeZone = {

    defaultTz: function () {
        return localStorage.getItem("csUserTimeZone") || null;
    },

    createDropDown: function (domSelector) {
        var defaultTz = csTimeZone.defaultTz();
        var tzSelect = `<select id="csTzSelect" class="show-tick" data-container="#schedule" data-width="fit"
                                data-live-search="true" data-live-search-placeholder="search timezone"
                                data-style="btn-outline-info">
                            <option value="">select timezone
                        </option>`;
        var tzArr = moment.tz.names();
        tzArr.forEach(function (tz) {
            var selected = defaultTz === tz ? "selected" : "";
            tzSelect += `<option value="${tz}" ${selected}>${tz}</option>`;
        });
        tzSelect += '</select>';

        $(domSelector).append(tzSelect);
        $('#csTzSelect').selectpicker();
    },

    registerEvents: function (params) {
        $("body").on("changed.bs.select", "#csTzSelect", function ($e) {
            if ($(this).val()) {
                localStorage.setItem("csUserTimeZone", $(this).val());
                csTimeZone.convertAllScheduleRows($(this).val());
            }
        })
    },

    convertAllScheduleRows: function name(selectedTz) {
        $(".schedule-item").each(function (index, dom) {
            var istDate = $(dom).attr("data-ist-date");
            var userTzDate = csTimeZone.convertIstToSelected(istDate, selectedTz);
            var target = $(dom).find(".userTzTime");
            csTimeZone.updateDom(userTzDate, target);
        });
    },

    updateDom: function (userTzDate, targetDom) {
        if (userTzDate.day) {
            var tzText = userTzDate.day + ", " + userTzDate.time;
            targetDom.removeClass("text-secondary").addClass("text-warning").text(tzText);
        }
        else {
            targetDom.removeClass("text-warning").addClass("text-secondary").text(userTzDate.time);
        }
        return targetDom;
    },

    addDatesToDays: function (days) {
        let knownDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

        for (let day of days) {
            if (!day.date) {
                let indexOfWeek = knownDays.indexOf(day.name);
                if (indexOfWeek >= 0) {
                    let date = moment().day(indexOfWeek);
                    day.date = date.format("YYYY-MM-DD");
                } else {
                    day.date = "missing";
                }
            }
        }

        return days;
    },

    formatScheduleDateTime: function (date, istTime) {
        var fullDateIST = date + " " + istTime + " +05:30";
        var mDateTime = moment.parseZone(fullDateIST, "YYYY-MM-DD hh:mm A ZZ");
        return mDateTime.format();
    },

    convertIstToSelected: function (istTime, timeZoneName) {
        var istDate = moment.parseZone(istTime);
        var userDate = istDate.clone().tz(timeZoneName);
        var ret = { time: userDate.format("hh:mm A z") };
        if (istDate.format("dddd") != userDate.format("dddd")) {
            ret.day = userDate.format("dddd");
        }
        return ret;

    }

};
jQuery(document).ready(function ($) {
    csService.init();
});

var csService = {
    url: 'http://catholicstreamlive-env.eba-mh2niqse.ap-south-1.elasticbeanstalk.com',
    //url: 'https://api.catholicstreams.live',

    init: function (params) {
        csService.getLanguanges();

        $("body").on("click", "#instructions", csService.showGuidelineModal);

        $("body").on('shown.bs.tab', '.daySelection a[data-toggle="tab"]', function ($event) {
            var aLink = $($event.target);
            var tabId = aLink.attr("href");
            if ($(tabId).children(".schedule-item").length < 1) {
                var day = aLink.attr("data-day-id");
                var date = aLink.attr("data-day-date");
                var language = aLink.parents(".tab-pane").attr("data-mass-lang");
                csService.getSchedule(language, day, tabId, date, true);
            }
            csService.scrollToHolyMass();
        });

    },

    scrollToHolyMass: function () {
        $('html, body').animate({
            scrollTop: $("#holyMass").offset().top - $("#header").outerHeight()
        }, 1000, 'easeInOutExpo');
    },

    showUnderMaintanence: function () {
        $("#schedule, #footer").hide();
        $('#maintenanceModal').modal('show');
    },

    showGuidelineModal: function () {
        $('#guidelinesModal').modal('show');
    },

    capitalizeString: function (string) {
        return string.replace(/\b\w/g, function (l) { return l.toUpperCase() })
    },

    getLanguanges: function () {
        $.get(csService.url + '/getLanguages', function (data) {
            csService.showGuidelineModal();
            csService.displayLanguages(data);
        })
            .fail(function () {
                console.log('failed to get languages!');
                csService.showUnderMaintanence();
            });
    },

    getDays: function () {
        $.get(csService.url + '/getDays', function (data) {
            days = csTimeZone.addDatesToDays(data);
            csService.displayDays(days)
        } )
            .fail(function () {
                console.log('failed to get days!');
            });
    },

    getSchedule: function (language, day, tabId, date, addWow) {
        $.get(csService.url + `/getSchedule/${language}/${day}`, function (data) {
            csService.displaySchedule(data, tabId, date, addWow)
        })
            .fail(function () {
                console.log('failed to get schedule!');
            });
    },

    displayLanguages: function (data) {
        var firstItem = true;

        $("#langSelection").siblings(".loadingContent").fadeOut(500, function () {
            $(this).remove();

            $.each(data, function (index, orginalLang) {
                var language = csService.capitalizeString(orginalLang);
                var activeClass = firstItem ? "show active" : "";
                // add language button
                $("#langSelection").append(
                    `<li class="nav-item lej-padding">
                        <a class="nav-link ${activeClass}" href="#${language}Mass" role="tab" data-toggle="tab"
                            aria-selected="${firstItem}">${language}</a>
                     </li>`
                );

                //add schedule tab panel
                $("#holyMass").append(
                    `<div id="${language}Mass" data-mass-lang="${orginalLang}" role="tabpanel" class="tab-pane fade ${activeClass}">
                        <h3 class="text-center text-capitalize font-weight-bold text-danger">${language} Holy Mass</h3>
                        
                        <ul class="daySelection nav nav-tabs nav-fill" role="tablist">
                            <li class="nav-item lej-padding icon">
                                <a class="nav-link" data-toggle="tooltip" data-placement="top" title="select day to view timing"><i class="far fa-calendar-alt"></i></a>
                            </li>
                        </ul>
                        <div class="tab-content row justify-content-center m-3">
                            <div class="d-flex justify-content-center loadingContent">
                                <div class="spinner-grow text-warning" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>`
                );

                firstItem = false;
            })

            $('[data-toggle="tooltip"]').tooltip();

            csService.getDays();
        });

    },

    displayDays: function (days) {
        $.each($("ul.daySelection"), function (index, dom) {
            var language = $(dom).parents(".tab-pane").attr("data-mass-lang");
            var tabContent = $(dom).siblings("div.tab-content");

            $(tabContent).children(".loadingContent").fadeOut(500, function () {
                $(this).remove();

                var firstItem = true;
                $.each(days, function (index, day) {
                    var normalDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                    var wideBtnClass = !normalDays.includes(day.name) ? "wide" : "";
                    var activeClass = firstItem ? "show active" : "";
                    var langDayId = (day.name + csService.capitalizeString(language) + "Mass").replace(' ', '-');
                    $(dom).append(
                        `<li class="nav-item lej-padding ${wideBtnClass}">
                            <a class="nav-link ${activeClass}" href="#${langDayId}" 
                                data-day-id="${day.name}" data-day-date="${day.date}" role="tab" data-toggle="tab">
                                ${csService.capitalizeString(day.displayName)}
                            </a>
                        </li>`
                    );

                    $(tabContent).append(
                        `<div  role="tabpanel" class="col-lg-9  tab-pane fade ${activeClass}" id="${langDayId}">
                            <div class="d-flex justify-content-center m-3 loadingContent">
                                <div class="spinner-grow text-warning" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                        </div>`
                    );

                    if (firstItem) {
                        var addWow = $(dom).is(":visible");
                        csService.getSchedule(language, day.name, `#${langDayId}`, day.date, addWow);
                    }

                    firstItem = false;
                });
            });
        });
    },

    displaySchedule: function (data, tabId, date, addWow) {
        $(tabId).children(".loadingContent").fadeOut(500, function () {
            $(this).remove();
            $.each(data, function (index, row) {
                var wowClass = addWow ? "wow fadeInUp" : "";
                var description = row.description ? `<p>${row.description}</p>` : "";
                var scheduleTime = csTimeZone.formatScheduleDateTime(date, row.prettyTime);
                $target = $('<time class="userTzTime d-block"></time>');
                if(csTimeZone.defaultTz()) {
                    var userTzDate = csTimeZone.convertIstToSelected(scheduleTime, csTimeZone.defaultTz());
                    $target = csTimeZone.updateDom(userTzDate, $target);
                }
                $(tabId).append(
                    `<div class="row schedule-item ${wowClass}" data-ist-date="${scheduleTime}">
                        <div class="col-md-3 py-1 text-danger">
                            <time>${row.prettyTime} IST</time>
                            ${$target[0].outerHTML}
                        </div>
                        <div class="col-md-7 py-1">
                            <h4>${row.name}</h4>
                            ${description}
                        </div>
                        <div class="col-md-2 py-1">
                            <button class="btn btn-sm btn-warning watchStream" 
                                data-video-url="${row.link}"
                                data-video-title="${row.name}">
                                <i class="fa fa-television pr-1"></i>Watch
                            </button>
                        </div>
                    </div>`
                );

            })
        });

    }
}

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
jQuery(document).ready(function( $ ) {

  $('[data-toggle="tooltip"]').tooltip();

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function(){
    $('html, body').animate({scrollTop : 0},1500, 'easeInOutExpo');
    return false;
  });

  // Header fixed on scroll
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('#header').addClass('header-scrolled');
    } else {
      $('#header').removeClass('header-scrolled');
    }
  });

  if ($(window).scrollTop() > 100) {
    $('#header').addClass('header-scrolled');
  }

  // Real view height for mobile devices
  if (window.matchMedia("(max-width: 767px)").matches) {
    $('#intro').css({ height: $(window).height() });
  }

  // Initiate the wowjs animation library
  new WOW().init();

  // Initialize Venobox
  // $('.venobox').venobox({
  //   overlayColor: 'rgba(6, 12, 34, 0.85)',
  //   closeBackground: '',
  //   closeColor: '#fff'
  // });

  // Initiate superfish on nav menu
  // $('.nav-menu').superfish({
  //   animation: {
  //     opacity: 'show'
  //   },
  //   speed: 400
  // });

  // Mobile Navigation
  if ($('#nav-menu-container').length) {
    var $mobile_nav = $('#nav-menu-container').clone().prop({
      id: 'mobile-nav'
    });
    $mobile_nav.find('> ul').attr({
      'class': '',
      'id': ''
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
    $('body').append('<div id="mobile-body-overly"></div>');
    $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>');

    $(document).on('click', '.menu-has-children i', function(e) {
      $(this).next().toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).toggleClass("fa-chevron-up fa-chevron-down");
    });

    $(document).on('click', '#mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
      $('#mobile-body-overly').toggle();
    });

    $(document).click(function(e) {
      var container = $("#mobile-nav, #mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
      }
    });
  } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
    $("#mobile-nav, #mobile-nav-toggle").hide();
  }

  // Smooth scroll for the menu and links with .scrollto classes
  $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        var top_space = 0;

        if ($('#header').length) {
          top_space = $('#header').outerHeight();

          if( ! $('#header').hasClass('header-fixed') ) {
            top_space = top_space - 20;
          }
        }

        $('html, body').animate({
          scrollTop: target.offset().top - top_space
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu').length) {
          $('.nav-menu .menu-active').removeClass('menu-active');
          $(this).closest('li').addClass('menu-active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Gallery carousel (uses the Owl Carousel library)
  // $(".gallery-carousel").owlCarousel({
  //   autoplay: true,
  //   dots: true,
  //   loop: true,
  //   center:true,
  //   responsive: { 0: { items: 1 }, 768: { items: 3 }, 992: { items: 4 }, 1200: {items: 5}
  //   }
  // });

  // Buy tickets select the ticket type on click
  $('#buy-ticket-modal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var ticketType = button.data('ticket-type');
    var modal = $(this);
    modal.find('#ticket-type').val(ticketType);
  })

});

function dayOfWeekAsString(dayIndex) {
  return ["sun","mon","tue","wed","thu","fri","sat"][dayIndex];
}
var day=dayOfWeekAsString(new Date().getDay());
$('#'+day).addClass('active');
$('#'+day).addClass('show');
$('#'+day+'-link').addClass('active');
$('#'+day+'-link').addClass('show');
$('#'+day+'-link').attr('aria-selected','true');