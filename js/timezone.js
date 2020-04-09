var csTimeZone = {

    createDropDown: function (domSelector) {
        var tzSelect = '<select class="csTzSelect" data-live-search="true"><option selected value="">select timezone</option>';
        var tzArr = moment.tz.names();
        tzArr.forEach(function (tz) {
            tzSelect += `<option value="${tz}">${tz}</option>`;
        });
        tzSelect += '</select>';

        $(domSelector).append(tzSelect);
        $('.csTzSelect').selectpicker();
    }

};