jQuery(document).ready(function ($) {
    csService.init();
});

var csService = {
    url: 'http://catholicstreamlive-env.eba-mh2niqse.ap-south-1.elasticbeanstalk.com',
    //url: 'https://api.catholicstreams.live',

    init: function (params) {
        csService.getLanguanges();

        $("body").on("click", ".badge.instructions", csService.showGuidelineModal);

        $("body").on('shown.bs.tab', '.daySelection a[data-toggle="tab"]', function ($event) {
            var aLink = $($event.target);
            var tabId = aLink.attr("href");
            if ($(tabId).children(".schedule-item").length < 1) {
                var day = aLink.attr("data-day-id");
                var language = aLink.parents(".tab-pane").attr("data-mass-lang");
                csService.getSchedule(language, day, tabId);
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
            csService.getDays();
        })
            .fail(function () {
                console.log('failed to get languages!');
                csService.showUnderMaintanence();
            });
    },

    getDays: function () {
        $.get(csService.url + '/getDays', csService.displayDays)
            .fail(function () {
                console.log('failed to get days!');
            });
    },

    getSchedule: function (language, day, tabId) {
        $.get(csService.url + `/getSchedule/${language}/${day}`, function (data) {
            csService.displaySchedule(data, tabId)
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
                        <p class="mb-2 mb-sm-3 mb-md-4">All timings are in IST (GMT+5.30).
                            <span class="instructions badge badge-info badge-pill my-1">
                                <i class="fa fa-book pr-1"></i>Guidelines
                            </span>
                        </p>
                        <ul class="daySelection nav nav-tabs nav-fill" role="tablist">
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
        });



    },

    displayDays: function (days) {
        $.each($("ul.daySelection"), function (index, dom) {
            var language = $(dom).parents(".tab-pane").attr("id");
            var tabContent = $(dom).siblings("div.tab-content");

            $(tabContent).children(".loadingContent").fadeOut(500, function () {
                $(this).remove();
                $.each(days, function (index, day) {
                    var langDayId = (day.name + language).replace(' ', '-');
                    $(dom).append(
                        `<li class="nav-item lej-padding">
                            <a class="nav-link" href="#${langDayId}" data-day-id="${day.name}" role="tab" data-toggle="tab">${csService.capitalizeString(day.displayName)}</a>
                        </li>`
                    );

                    $(tabContent).append(
                        `<div  role="tabpanel" class="col-lg-9  tab-pane fade" id="${langDayId}">
                            <div class="d-flex justify-content-center m-3 loadingContent">
                                <div class="spinner-grow text-warning" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                        </div>`
                    );
                });
            });
        });
    },

    displaySchedule: function (data, tabId) {
        $(tabId).children(".loadingContent").fadeOut(500, function () {
            $(this).remove();
            $.each(data, function (index, row) {
                var description = row.description ? `<p>${row.description}</p>` : "";
                $(tabId).append(
                    `<div class="row schedule-item wow fadeInUp">
                        <div class="col-md-3 py-1 text-danger"><time>${row.prettyTime}</time></div>
                        <div class="col-md-7 py-1">
                            <h4>${row.name}</h4>
                            ${description}
                        </div>
                        <div class="col-md-2 py-1">
                            <a href="${row.link}" target="_blank"><button class="btn btn-sm btn-warning"><i
                                class="fa fa-television pr-1"></i>Watch</button> </a>
                        </div>
                    </div>`
                );

            })
        });

    }
}
