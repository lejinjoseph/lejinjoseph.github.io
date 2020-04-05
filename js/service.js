jQuery(document).ready(function ($) {
    csService.init();
});

var csService = {
    url: 'https://catholicstreamlive-env.eba-mh2niqse.ap-south-1.elasticbeanstalk.com',

    init: function (params) {
        csService.getLanguanges();

        $("body").on('shown.bs.tab', '.daySelection a[data-toggle="tab"]', function ($event) {
            var aLink = $($event.target);
            var tabId = aLink.attr("href");
            if ($(tabId).children(".schedule-item").length < 1) {
                var day = aLink.attr("data-day-id");
                var language = aLink.parents(".tab-pane").attr("data-mass-lang");
                csService.getSchedule(language, day, tabId);
            }
        });

    },

    capitalizeString: function (string) {
        return string.replace(/\b\w/g, function (l) { return l.toUpperCase() })
    },

    getLanguanges: function () {
        $.get(csService.url + '/getLanguages', function (data) {
            csService.displayLanguages(data);
            csService.getDays();
        })
            .fail(function () {
                console.log('failed to get languages!');
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
        $.each(data, function (index, orginalLang) {
            language = csService.capitalizeString(orginalLang);
            // add language button
            $("#langSelection").append(
                `<li class="nav-item lej-padding">
                    <a class="nav-link" href="#${language}Mass" role="tab" data-toggle="tab"
                        aria-selected="true">${language}</a>
                 </li>`
            );

            //add schedule tab panel
            $("#holyMass").append(
                `<div id="${language}Mass" data-mass-lang="${orginalLang}" role="tabpanel" class="tab-pane fade">
                    <h3 class="text-center text-capitalize font-weight-bold text-danger">${language} Holy Mass</h3>
                    <p>All timings are in IST (GMT+5.30).
                        <span class="instructions badge badge-info badge-pill my-1" onclick="openModal()"><i
                            class="fa fa-book pr-1"></i>Guidelines</span>
                    </p>
                    <ul class="daySelection nav nav-tabs nav-fill" role="tablist">
                    </ul>
                    <div class="tab-content row justify-content-center m-3">
                        <div class="d-flex justify-content-center">
                            <div class="spinner-grow text-warning" role="status">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>`
            );
        })

    },

    displayDays: function (days) {
        $.each($("ul.daySelection"), function (index, dom) {
            var language = $(dom).parents(".tab-pane").attr("id");
            var tabContent = $(dom).siblings("div.tab-content");
            $(tabContent).empty();
            $.each(days, function (index, day) {
                var langDayId = (day.name + language).replace(' ', '-');
                $(dom).append(
                    `<li class="nav-item lej-padding">
                        <a class="nav-link" href="#${langDayId}" data-day-id="${day.name}" role="tab" data-toggle="tab">${csService.capitalizeString(day.displayName)}</a>
                    </li>`
                );

                $(tabContent).append(
                    `<div  role="tabpanel" class="col-lg-9  tab-pane fade" id="${langDayId}">
                        <div class="d-flex justify-content-center m-3">
                            <div class="spinner-grow text-warning" role="status">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>`
                );
            })
        });

    },

    displaySchedule: function (data, tabId) {
        $(tabId).empty();
        $.each(data, function (index, row) {
            var description = row.description ? `<p>${row.description}</p>` : "";
            $(tabId).append(
                `<div class="row schedule-item">
                    <div class="col-md-3 py-1"><time>${row.prettyTime}</time></div>
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

    }
}
