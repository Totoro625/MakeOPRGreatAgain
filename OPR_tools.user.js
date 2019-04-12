// ==UserScript==
// @name         OPR tools CN for android
// @version      2.0.0-modify-1.0
// @description  快速打分安卓版
// @match        https://opr.ingress.com/*
// @grant        unsafeWindow
// @grant        GM_notification
// @grant        GM_addStyle
// @homepageURL
// @downloadURL
// @updateURL
// @require      https://raw.githubusercontent.com/wandergis/coordtransform/master/index.js
// @require      https://cdn.rawgit.com/alertifyjs/alertify.js/v1.0.10/dist/js/alertify.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.4.4/proj4.js
// ==/UserScript==

// original author 1110101,CubicPill,modify by totoro625
// original source https://gitlab.com/1110101/opr-tools,https://github.com/CubicPill/OPR-tools-CN
// merge-requests welcome

/*
 MIT License

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

const STRINGS_EN = {
    baidu: "Baidu",
    tencent: "Tencent",
    amap: "Amap",
    bdstreetview: "Baidu StreetView",
    photo: "Bad Photo",
    private: "Private Area",
    school: "School",
    face: "Face",
    temporary: "Temporary",
    location: "Location",
    agent: "Name In Title",
    apartment: "Apartment Sign",
    cemetery: "Cemetery",
    street_sign: "City/Street Sign",
    fire_dept: "Fire Department",
    hospital: "Hospital",
    hotel: "Hotel/Inn",
    exercise: "Exercise Equipment",
    post: "Post Office",
    survey_marker: "Survey Marker",
    water_tower: "Water Tower",
    fountain: "Fountain",
    gazebo: "Gazebo",
    mt_marker: "Mountain Top Marker",
    playground: "Playground",
    ruin: "Ruins",
    trail_mk: "Trail Marker",
    percent_processed: "Percent Processed",
    next_badge_tier: "Next badge tier",
    new_preset_name: "New preset name:",
    preset: "Preset",
    created_preset: "✔ Created preset",
    delete_preset: "Deleted preset",
    applied_preset: "✔ Applied",
    preset_tooltip: "(OPR-Tools) Create your own presets for stuff like churches, playgrounds or crosses'.\nHowto: Answer every question you want included and click on the +Button.\n\nTo delete a preset shift-click it.",
    expired: "EXPIRED",
};

const STRINGS_CN = {
    baidu: "百度地图",
    tencent: "腾讯地图",
    amap: "高德地图",
    bdstreetview: "百度街景",
    photo: "低质量图片",
    private: "封闭区域",
    school: "中小学",
    face: "人脸",
    temporary: "临时景观",
    location: "位置不准确",
    agent: "标题包含 Codename",
    apartment: "小区招牌",
    cemetery: "墓园",
    street_sign: "路牌",
    fire_dept: "消防局",
    hospital: "医院",
    hotel: "酒店",
    exercise: "健身器材",
    post: "邮局",
    survey_marker: "测量地标",
    water_tower: "水塔",
    fountain: "喷泉",
    gazebo: "亭子",
    mt_marker: "山顶标记",
    playground: "运动场",
    ruin: "遗址",
    trail_mk: "步道路标",
    percent_processed: "已处理的百分比",
    next_badge_tier: "下一等级牌子",
    preset: "预设评分",
    new_preset_name: "新预设评分名称:",
    created_preset: "✔ 创建预设",
    delete_preset: "删除预设",
    applied_preset: "✔ 使用预设",
    preset_tooltip: "(OPR-Tools) 为长椅、操场等物品建立自己的预设评分.\n使用方法: 对所有希望包括的评分项评分，然后点击 + 按钮.\n\n删除预设请按住 Shift 键然后点击。",
    expired: "已过期",

};
let STRINGS = STRINGS_CN;

if (navigator.language.search('en'))
    STRINGS = STRINGS_EN;
STRINGS = STRINGS_CN;

const OPRT = {
    SCANNER_OFFSET: "oprt_scanner_offset",
    REFRESH: "oprt_refresh",
    FROM_REFRESH: "oprt_from_refresh",
    REFRESH_NOTI_SOUND: "oprt_refresh_noti_sound",
    REFRESH_NOTI_DESKTOP: "oprt_refresh_noti_desktop",
    MAP_TYPE: "oprt_map_type",
};


// polyfill for ViolentMonkey
if (typeof exportFunction !== "function") {
    exportFunction = (func, scope, options) => {
        if (options && options.defineAs) {
            scope[options.defineAs] = func;
        }
        return func;
    };
}
if (typeof cloneInto !== "function") {
    cloneInto = obj => obj;
}

function addGlobalStyle(css) {
    GM_addStyle(css);

    addGlobalStyle = () => {
    }; // noop after first run
}


function init() {
    const w = typeof unsafeWindow == "undefined" ? window : unsafeWindow;
    let tryNumber = 15;

    let oprt_customPresets;

    let browserLocale = window.navigator.languages[0] || window.navigator.language || "en";

    const initWatcher = setInterval(() => {
        if (tryNumber === 0) {
            clearInterval(initWatcher);
            w.document.getElementById("NewSubmissionController")
                .insertAdjacentHTML("afterBegin", `
<div class='alert alert-danger'><strong><span class='glyphicon glyphicon-remove'></span> OPR-Tools initialization failed, refresh page</strong></div>
`);
            addRefreshContainer();
            return;
        }
        if (w.angular) {
            let err = false;
            try {
                initAngular();
            }
            catch (error) {
                err = error;
                // console.log(error);
            }
            if (!err) {
                try {
                    initScript();
                    clearInterval(initWatcher);
                } catch (error) {
                    console.log(error);
                    if (error === 41) {
                        addRefreshContainer();
                    }
                    if (error !== 42) {
                        clearInterval(initWatcher);
                    }
                }
            }
        }
        tryNumber--;
    }, 1000);

    function initAngular() {
        const el = w.document.querySelector("[ng-app='portalApp']");
        w.$app = w.angular.element(el);
        w.$injector = w.$app.injector();
        w.inject = w.$injector.invoke;
        w.$rootScope = w.$app.scope();

        w.getService = function getService(serviceName) {
            w.inject([serviceName, function (s) {
                w[serviceName] = s;
            }]);
        };

        w.$scope = element => w.angular.element(element).scope();
    }

    function initScript() {
        const subMissionDiv = w.document.getElementById("NewSubmissionController");
        const subController = w.$scope(subMissionDiv).subCtrl;
        const newPortalData = subController.pageData;

        const whatController = w.$scope(w.document.getElementById("WhatIsItController")).whatCtrl;

        const answerDiv = w.document.getElementById("AnswersController");
        const ansController = w.$scope(answerDiv).answerCtrl;

        // adding CSS
        addGlobalStyle(GLOBAL_CSS);

        modifyHeader();

        if (subController.errorMessage !== "") {
            // no portal analysis data available
            throw 41; // @todo better error code
        }

        if (typeof newPortalData === "undefined") {
            // no submission data present
            throw 42; // @todo better error code
        }

        // detect portal edit
        if (subController.reviewType === "NEW") {
            modifyNewPage(ansController, subController, whatController, newPortalData);
        } else if (subController.reviewType === "EDIT") {
            modifyEditPage(ansController, subController, newPortalData);
        }

        checkIfAutorefresh();

        startExpirationTimer(subController);

    }

    function modifyNewPage(ansController, subController, whatController, newPortalData) {

        mapButtons(newPortalData, w.document.getElementById("descriptionDiv"), "beforeEnd");

        let newSubmitDiv = moveSubmitButton();
        let {submitButton, submitAndNext} = quickSubmitButton(newSubmitDiv, ansController);

        textButtons();

        const customPresetUI = `
<div class="row" id="presets"><div class="col-xs-12">
	<div>` + STRINGS.preset + `&nbsp;<button class="button btn btn-default btn-xs" id="addPreset">+</button></div>
	<div class='btn-group' id="customPresets"></div>
</div></div>`;

        w.document.querySelector("form[name='answers'] div.row").insertAdjacentHTML("afterend", customPresetUI);

        addCustomPresetButtons();

        // we have to inject the tooltip to angular
        w.$injector.invoke(cloneInto(["$compile", ($compile) => {
            let compiledSubmit = $compile(`<span class="glyphicon glyphicon-info-sign darkgray" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder" uib-tooltip="` + STRINGS.preset_tooltip + `"></span>&nbsp; `)(w.$scope(document.getElementById("descriptionDiv")));
            w.document.getElementById("addPreset").insertAdjacentElement("beforebegin", compiledSubmit[0]);
        }], w, {cloneFunctions: true}));

        // click listener for +preset button
        w.document.getElementById("addPreset").addEventListener("click", exportFunction(event => {
            alertify.okBtn("Save").prompt(STRINGS.new_preset_name,
                (value, event) => {
                    event.preventDefault();
                    if (value == "undefined" || value == "") {
                        return;
                    }
                    saveCustomPreset(value, ansController, whatController);
                    alertify.success(STRINGS.created_preset + ` <i>${value}</i>`);
                    addCustomPresetButtons();

                }, event => {
                    event.preventDefault();
                }
            );
        }), w, false);

        let clickListener = exportFunction(event => {
            const source = event.target || event.srcElement;
            let value = source.id;
            if (value === "" || event.target.nodeName !== "BUTTON") {
                return;
            }

            let preset = oprt_customPresets.find(item => item.uid === value);

            if (event.shiftKey) {
                alertify.log(STRINGS.delete_preset + ` <i>${preset.label}</i>`);
                w.document.getElementById(preset.uid).remove();
                deleteCustomPreset(preset);
                return;
            }

            ansController.formData.quality = preset.quality;
            ansController.formData.description = preset.description;
            ansController.formData.cultural = preset.cultural;
            ansController.formData.uniqueness = preset.uniqueness;
            ansController.formData.location = preset.location;
            ansController.formData.safety = preset.safety;

            // the controller's set by ID function doesn't work
            // and autocomplete breaks if there are any spaces
            // so set the field to the first word from name and match autocomplete by ID
            // at the very least, I know this will set it and leave the UI looking like it was manually set.
            whatController.whatInput = preset.nodeName.split(" ")[0];
            let nodes = whatController.getWhatAutocomplete();
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id == preset.nodeId) {
                    whatController.whatNode = nodes[i];
                    break;
                }
            }
            whatController.whatInput = "";

            // update ui
            event.target.blur();
            w.$rootScope.$apply();

            alertify.success(STRINGS.applied_preset + ` <i>${preset.label}</i>`);

        }, w);

        w.document.getElementById("customPresets").addEventListener("click", clickListener, false);



        // hotfix for #27 not sure if it works
        let _initMap = subController.initMap;
        subController.initMap = exportFunction(() => {
            _initMap();
            mapMarker(subController.markers);
        });

        mapOriginCircle(subController.map2);
        mapMarker(subController.markers);
        mapTypes(subController.map, false);
        mapTypes(subController.map2, true);

        // hook resetStreetView() and re-apply map types and options to first map. not needed for duplicates because resetMap() just resets the position
        let _resetStreetView = subController.resetStreetView;
        subController.resetStreetView = exportFunction(() => {
            _resetStreetView();
            mapOriginCircle(subController.map2)
            mapTypes(subController.map2, true);
        }, w);

        // adding a green 40m circle around the new location marker that updates on dragEnd
        let draggableMarkerCircle;
        let _showDraggableMarker = subController.showDraggableMarker;
        subController.showDraggableMarker = exportFunction(() => {
            _showDraggableMarker();

            w.getService("NewSubmissionDataService");
            let newLocMarker = w.NewSubmissionDataService.getNewLocationMarker();

            google.maps.event.addListener(newLocMarker, "dragend", function () {

                if (draggableMarkerCircle == null)
                    draggableMarkerCircle = new google.maps.Circle({
                        map: subController.map2,
                        center: newLocMarker.position,
                        radius: 40,
                        strokeColor: "#4CAF50", // material green 500
                        strokeOpacity: 1,
                        strokeWeight: 2,
                        fillOpacity: 0,
                    });
                else draggableMarkerCircle.setCenter(newLocMarker.position);

            });

        });

        document.querySelector("#street-view + small").insertAdjacentHTML("beforeBegin", "<small class='pull-left'><span style='color:#ebbc4a'>Circle:</span> 40m</small>");

        // move portal rating to the right side. don't move on mobile devices / small width
        if (screen.availWidth > 768) {
            const scorePanel = w.document.querySelector("div[class~='pull-right']");
            let nodeToMove = w.document.querySelector("div[class='btn-group']").parentElement;
            scorePanel.insertBefore(nodeToMove, scorePanel.firstChild);
        }

        // bind click-event to Dup-Images-Filmstrip. result: a click to the detail-image the large version is loaded in another tab
        const imgDups = w.document.querySelectorAll("#map-filmstrip > ul > li > img");
        const openFullImage = function () {
            w.open(`${this.src}=s0`, "fulldupimage");
        };
        for (let imgSep in imgDups) {
            if (imgDups.hasOwnProperty(imgSep)) {
                imgDups[imgSep].addEventListener("click", () => {
                    const imgDup = w.document.querySelector("#content > img");
                    if (imgDup !== null) {
                        imgDup.removeEventListener("click", openFullImage);
                        imgDup.addEventListener("click", openFullImage);
                        imgDup.setAttribute("style", "cursor: pointer;");
                    }
                });
            }
        }

        
        // automatically open the first listed possible duplicate
        try {
            const e = w.document.querySelector("#map-filmstrip > ul > li:nth-child(1) > img");
            if (e !== null) {
                setTimeout(() => {
                    e.click();
                }, 500);
            }
        } catch (err) {
        }

        expandWhatIsItBox();

        // keyboard navigation
        // keys 1-5 to vote
        // space/enter to confirm dialogs
        // esc or numpad "/" to reset selector
        // Numpad + - to navigate

        let currentSelectable = 0;
        let maxItems = 7;

        // a list of all 6 star button rows, and the two submit buttons
        let starsAndSubmitButtons = w.document.querySelectorAll(".col-sm-6 .btn-group, .col-sm-4.hidden-xs .btn-group, .big-submit-button");

        function highlight() {
            if (currentSelectable <= maxItems - 2) {
                submitAndNext.blur();
                submitButton.blur();
            } else if (currentSelectable == 6) {
                submitAndNext.focus();
            }
            else if (currentSelectable == 7) {
                submitButton.focus();
            }
        }

        addEventListener("keydown", (event) => {
            highlight();
        });
        highlight();
        modifyNewPage = () => {
        }; // just run once
    }

    function modifyEditPage(ansController, subController, newPortalData) {
        let editDiv = w.document.querySelector("div[ng-show=\"subCtrl.reviewType==='EDIT'\"]");
        mapButtons(newPortalData, editDiv, "afterEnd");
        let newSubmitDiv = moveSubmitButton();
        let {submitButton, submitAndNext} = quickSubmitButton(newSubmitDiv, ansController);
        textButtons();
        mapTypes(subController.locationEditsMap, true);
        /* EDIT PORTAL */
        addEventListener("keydown", (event) => {
            // do not do anything if a text area or a input with type text has focus
            if (w.document.querySelector("input[type=text]:focus") || w.document.querySelector("textarea:focus")) {
                return;
            }
            // select previous rating
        });
    }

    // add map buttons
    function mapButtons(newPortalData, targetElement, where) {
        // coordinate format conversion
        const wgs_lat = newPortalData.lat;
        const wgs_lng = newPortalData.lng;
        const name = newPortalData.title;
        const mapButtons = [];
        targetElement.insertAdjacentHTML(where, `<div><div class='btn-group'>${mapButtons.join("")}`);
    }

    // add new button "Submit and reload", skipping "Your analysis has been recorded." dialog
    function quickSubmitButton(submitDiv, ansController) {
        let submitButton = submitDiv.querySelector("button");
        submitButton.classList.add("btn", "btn-warning");
        let submitAndNext = submitButton.cloneNode(false);
        submitAndNext.innerHTML = `请勿使用`;
        return {submitButton, submitAndNext};
    }

    function textButtons() {
        let emergencyWay = "";
        if (browserLocale.includes("de")) {
            emergencyWay = "RETTUNGSWEG!1";
        } else {
            emergencyWay = "Emergency Way";
        }
    }


    // adding a 40m circle around the portal (capture range)
    function mapOriginCircle(map) {}
    // replace map markers with a nice circle
    function mapMarker(markers) {
        for (let i = 0; i < markers.length; ++i) {
            const marker = markers[i];
            marker.setIcon(PORTAL_MARKER);
        }
    }

    // set available map types
    function mapTypes(map, isMainMap) {}

    // move submit button to right side of classification-div. don't move on mobile devices / small width
    function moveSubmitButton() {
        const submitDiv = w.document.querySelectorAll("#submitDiv, #submitDiv + .text-center");

        if (screen.availWidth > 768) {
            let newSubmitDiv = w.document.createElement("div");
            const classificationRow = w.document.querySelector(".classification-row");
            newSubmitDiv.className = "col-xs-12 col-sm-6";
            submitDiv[0].style.marginTop = 16;
            newSubmitDiv.appendChild(submitDiv[0]);
            newSubmitDiv.appendChild(submitDiv[1]);
            classificationRow.insertAdjacentElement("afterend", newSubmitDiv);

            // edit-page - remove .col-sm-offset-3 from .classification-row (why did you add this, niantic?
            classificationRow.classList.remove("col-sm-offset-3");
            return newSubmitDiv;
        } else {
            return submitDiv[0];
        }
    }

    // expand automatically the "What is it?" filter text box
    function expandWhatIsItBox() {
        try {
            const f = w.document.querySelector("#WhatIsItController > div > p > span.ingress-mid-blue.text-center");
            setTimeout(() => {
                f.click();
            }, 250);
        } catch (err) {
        }
    }


    function modifyHeader() {
        // stats enhancements: add processed by nia, percent processed, progress to next recon badge numbers

        // get scanner offset from localStorage
        let oprt_scanner_offset = parseInt(w.localStorage.getItem(OPRT.SCANNER_OFFSET)) || 0;

        const lastPlayerStatLine = w.document.querySelector("#player_stats:not(.visible-xs) div");
        const stats = w.document.querySelector("#player_stats").children[2];

        const reviewed = parseInt(stats.children[3].children[2].innerText);
        const accepted = parseInt(stats.children[5].children[2].innerText);
        const rejected = parseInt(stats.children[7].children[2].innerText);

        const processed = accepted + rejected - oprt_scanner_offset;
        const percent = Math.round(processed / reviewed * 1000) / 10;

        const reconBadge = {100: "Bronze", 750: "Silver", 2500: "Gold", 5000: "Platin", 10000: "Black"};
        let nextBadgeName, nextBadgeCount;

        for (const key in reconBadge) {
            if (processed <= key) {
                nextBadgeCount = key;
                nextBadgeName = reconBadge[key];
                break;
            }
        }
        const nextBadgeProcess = processed / nextBadgeCount * 100;

        lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<br>
<p><span class="glyphicon glyphicon-info-sign ingress-gray pull-left"></span><span style="margin-left: 5px;" class="ingress-mid-blue pull-left">Processed <u>and</u> accepted analyses:</span> <span class="gold pull-right">${processed} (${percent}%) </span></p>`);

        if (accepted < 10000) {

            lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `
<br><div>Next recon badge tier: <b>${nextBadgeName} (${nextBadgeCount})</b><span class='pull-right'></span>
<div class='progress'>
<div class='progress-bar progress-bar-warning'
role='progressbar'
aria-valuenow='${nextBadgeProcess}'
aria-valuemin='0'
aria-valuemax='100'
style='width: ${Math.round(nextBadgeProcess)}%;'
title='${nextBadgeCount - processed} to go'>
${Math.round(nextBadgeProcess)}%
</div></div></div>
`);
        }

        else lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<hr>`);
        lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `<p><i class="glyphicon glyphicon-share"></i> <input readonly onFocus="this.select();" style="width: 90%;" type="text"
value="Reviewed: ${reviewed} / Processed: ${accepted + rejected } (Created: ${accepted}/ Rejected: ${rejected}) / ${Math.round(percent)}%"/></p>`);

        let tooltipSpan = `<span class="glyphicon glyphicon-info-sign ingress-gray pull-left" uib-tooltip-trigger="outsideclick" uib-tooltip-placement="left" tooltip-class="goldBorder"
uib-tooltip="Use negative values, if scanner is ahead of OPR"></span>`;

        // ** opr-scanner offset
        if (accepted < 10000) {
            lastPlayerStatLine.insertAdjacentHTML("beforeEnd", `
<p id='scannerOffsetContainer'>
<span style="margin-left: 5px" class="ingress-mid-blue pull-left">Scanner offset:</span>
<input id="scannerOffset" onFocus="this.select();" type="text" name="scannerOffset" size="8" class="pull-right" value="${oprt_scanner_offset}">
</p>`);
        }

        // we have to inject the tooltip to angular
        w.$injector.invoke(cloneInto(["$compile", ($compile) => {
            let compiledSubmit = $compile(tooltipSpan)(w.$scope(stats));
            w.document.getElementById("scannerOffsetContainer").insertAdjacentElement("afterbegin", compiledSubmit[0]);
        }], w, {cloneFunctions: true}));


        ["change", "keyup", "cut", "paste", "input"].forEach(e => {
            w.document.getElementById("scannerOffset").addEventListener(e, (event) => {
                w.localStorage.setItem(OPRT.SCANNER_OFFSET, event.target.value);
            });
        });
        // **

        modifyHeader = () => {
        }; // just run once
    }

    function addRefreshContainer() {

        let cbxRefresh = w.document.createElement("input");
        let cbxRefreshSound = w.document.createElement("input");
        let cbxRefreshDesktop = w.document.createElement("input");

        cbxRefresh.id = OPRT.REFRESH;
        cbxRefresh.type = "checkbox";
        cbxRefresh.checked = (w.localStorage.getItem(cbxRefresh.id) == "true");

        cbxRefreshSound.id = OPRT.REFRESH_NOTI_SOUND;
        cbxRefreshSound.type = "checkbox";
        cbxRefreshSound.checked = (w.localStorage.getItem(cbxRefreshSound.id) == "true");

        cbxRefreshDesktop.id = OPRT.REFRESH_NOTI_DESKTOP;
        cbxRefreshDesktop.type = "checkbox";
        cbxRefreshDesktop.checked = (w.localStorage.getItem(cbxRefreshDesktop.id) == "true");

        let refreshPanel = w.document.createElement("div");
        refreshPanel.className = "panel panel-ingress";

        refreshPanel.addEventListener("change", (event) => {
            w.localStorage.setItem(event.target.id, event.target.checked); // i'm lazy
            if (event.target.checked) {
                startRefresh();
            } else {
                stopRefresh();
            }
        });

        refreshPanel.innerHTML = `
<div class='panel-heading'><span class='glyphicon glyphicon-refresh'></span> Refresh <sup>beta</sup> <a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success pull-right'>OPR-Tools</span></a></div>
<div id='cbxDiv' class='panel-body bg-primary' style='background:black;'></div>`;

        refreshPanel.querySelector("#cbxDiv").insertAdjacentElement("afterbegin", appendCheckbox(cbxRefreshSound, "Notification sound"));
        refreshPanel.querySelector("#cbxDiv").insertAdjacentElement("afterbegin", appendCheckbox(cbxRefreshDesktop, "Desktop notification"));
        refreshPanel.querySelector("#cbxDiv").insertAdjacentElement("afterbegin", appendCheckbox(cbxRefresh, "Refresh every 5-10 minutes"));

        let colDiv = w.document.createElement("div");
        colDiv.className = "col-md-4 col-md-offset-4";
        colDiv.appendChild(refreshPanel);

        let rowDiv = w.document.createElement("div");
        rowDiv.className = "row";
        rowDiv.appendChild(colDiv);

        w.document.getElementById("NewSubmissionController").insertAdjacentElement("beforeend", rowDiv);

        cbxRefresh.checked === true ? startRefresh() : stopRefresh();

        function appendCheckbox(checkbox, text) {
            let label = w.document.createElement("label");
            let div = w.document.createElement("div");
            div.className = "checkbox";
            label.appendChild(checkbox);
            label.appendChild(w.document.createTextNode(text));
            div.appendChild(label);
            return div;
        }

        addRefreshContainer = () => {
        }; // run only once
    }

    let refreshIntervalID;

    function startRefresh() {
        let time = getRandomIntInclusive(5, 10) * 60000;

        refreshIntervalID = setInterval(() => {
            reloadOPR();
        }, time);

        function reloadOPR() {
            clearInterval(refreshIntervalID);
            w.sessionStorage.setItem(OPRT.FROM_REFRESH, "true");
            w.document.location.reload();
        }

        // source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        function getRandomIntInclusive(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

    function stopRefresh() {
        clearInterval(refreshIntervalID);
    }

    function checkIfAutorefresh() {
        if (w.sessionStorage.getItem(OPRT.FROM_REFRESH)) {
            // reset flag
            w.sessionStorage.removeItem(OPRT.FROM_REFRESH);

            if (w.document.hidden) { // if tab in background: flash favicon
                let flag = true;

                if (w.localStorage.getItem(OPRT.REFRESH_NOTI_SOUND) == "true") {
                    let audio = document.createElement("audio");
                    audio.src = NOTIFICATION_SOUND;
                    audio.autoplay = true;
                }
                if (w.localStorage.getItem(OPRT.REFRESH_NOTI_DESKTOP) == "true") {
                    GM_notification({
                        "title": "OPR - New Portal Analysis Available",
                        "text": "by OPR-Tools",
                        "image": "https://gitlab.com/uploads/-/system/project/avatar/3311015/opr-tools.png",
                    });
                }

                let flashId = setInterval(() => {
                    flag = !flag;
                    changeFavicon(`${flag ? PORTAL_MARKER : "/imgpub/favicon.ico"}`);
                }, 1000);

                // stop flashing if tab in foreground
                addEventListener("visibilitychange", () => {
                    if (!w.document.hidden) {
                        changeFavicon("/imgpub/favicon.ico");
                        clearInterval(flashId);
                    }
                });
            }
        }
    }

    function changeFavicon(src) {
        let link = w.document.querySelector("link[rel='shortcut icon']");
        link.href = src;
    }

    function startExpirationTimer(subController) {

        w.document.querySelector("ul.nav.navbar-nav > li:nth-child(7)").insertAdjacentHTML("afterbegin", "<a><span id=\"countdownDisplay\"></span></a>");

        let countdownEnd = subController.countdownDate;
        let countdownDisplay = document.getElementById("countdownDisplay");
        countdownDisplay.style.color = "white";

        // Update the count down every 1 second
        let counterInterval = setInterval(function () {
            // Get todays date and time
            let now = new Date().getTime();
            // Find the distance between now an the count down date
            let distance = countdownEnd - now;
            // Time calculations for minutes and seconds
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Display the result in the element
            countdownDisplay.innerText = `${minutes}m ${seconds}s `;

            if (distance < 0) {
                // If the count down is finished, write some text
                clearInterval(counterInterval);
                countdownDisplay.innerText = STRINGS.expired;
                countdownDisplay.classList.add("blink");


            } else if (distance < 60) {
                countdownDisplay.style.color = "red";
            }
        }, 1000);
    }


    function addCustomPresetButtons() {
        // add customPreset UI
        oprt_customPresets = getCustomPresets(w);
        let customPresetOptions = "";
        for (const customPreset of oprt_customPresets) {
            customPresetOptions += `<button class='button btn btn-default customPresetButton' id='${customPreset.uid}'>${customPreset.label}</button>`;
        }
        w.document.getElementById("customPresets").innerHTML = customPresetOptions;
    }

    function getCustomPresets(w) {
        // simply to scope the string we don't need after JSON.parse
        let presetsJSON = w.localStorage.getItem("oprt_custom_presets");
        if (presetsJSON != null && presetsJSON != "") {
            return JSON.parse(presetsJSON);
        }
        return [];
    }

    function saveCustomPreset(label, ansController, whatController) {
        // uid snippet from https://stackoverflow.com/a/47496558/6447397
        let preset = {
            uid: [...Array(5)].map(() => Math.random().toString(36)[3]).join(""),
            label: label,
            nodeName: whatController.whatNode.name,
            nodeId: whatController.whatNode.id,
            quality: ansController.formData.quality,
            description: ansController.formData.description,
            cultural: ansController.formData.cultural,
            uniqueness: ansController.formData.uniqueness,
            location: ansController.formData.location,
            safety: ansController.formData.safety
        };
        oprt_customPresets.push(preset);
        w.localStorage.setItem("oprt_custom_presets", JSON.stringify(oprt_customPresets));
    }

    function deleteCustomPreset(preset) {
        oprt_customPresets = oprt_customPresets.filter(item => item.uid !== preset.uid);
        w.localStorage.setItem("oprt_custom_presets", JSON.stringify(oprt_customPresets));
    }

    function showHelp() {
        let helpString = `<a href='https://gitlab.com/1110101/opr-tools'><span class='label label-success'>OPR-Tools</span></a> Key shortcuts
<table class="table table-condensed ">
	<thead>
	<tr>
		<th>Key(s)</th>
		<th>Function</th>
	</tr>
	</thead>
	<tbody>
	<tr>
		<td>Keys 1-5, Numpad 1-5</td>
		<td>Valuate current selected field (the yellow highlighted one)</td>
	</tr>
	<tr>
		<td><i>Shift</i> + Keys 1-5</td>
		<td>Apply custom preset (if exists)</td>
	</tr>
	<tr>
		<td>D</td>
		<td>Mark current candidate as a duplicate of the opened portal in "duplicates"</td>
	</tr>
	<tr>
		<td>T</td>
		<td>Open title translation</td>
	</tr>
	<tr>
		<td>Y</td>
		<td>Open description translation</td>
	</tr>
	<tr>
		<td>Space, Enter, Numpad Enter</td>
		<td>Confirm dialog / Send valuation</td>
	</tr>
	<tr>
		<td>Tab, Numpad +</td>
		<td>Next field</td>
	</tr>
	<tr>
		<td>Shift, Backspace, Numpad -</td>
		<td>Previous field</td>
	</tr>
	<tr>
		<td>Esc, Numpad /</td>
		<td>First field</td>
	</tr>
	<tr>
		<td>^, Numpad *</td>
		<td>Skip Portal (if possible)</td>
	</tr>
	</tbody>
</table>`;

        alertify.closeLogOnClick(false).logPosition("bottom right").delay(0).log(helpString, (ev) => {
            ev.preventDefault();
            ev.target.closest("div.default.show").remove();

        }).reset();

    }

}

setTimeout(() => {
    init();
}, 500);


//region const

const GLOBAL_CSS = `
.dropdown {
position: relative;
display: inline-block;
}

.dropdown-content {
display: none;
position: absolute;
z-index: 1;
margin: 0;
}
.dropdown-menu li a {
color: #ddd !important;
}
.dropdown:hover .dropdown-content {
display: block;
background-color: #004746 !important;
border: 1px solid #0ff !important;
border-radius: 0px !important;

}
.dropdown-menu>li>a:focus, .dropdown-menu>li>a:hover {
background-color: #008780;
}
.modal-sm {
width: 350px !important;
}

/**
* Ingress Panel Style
*/

.panel-ingress {
background-color: #004746;
border: 1px solid #0ff;
border-radius: 1px;
box-shadow: inset 0 0 6px rgba(255, 255, 255, 1);
color: #0ff;
}

/**
* Tooltip Styles
*/

/* Add this attribute to the element that needs a tooltip */
[data-tooltip] {
position: relative;
cursor: pointer;
}

/* Hide the tooltip content by default */
[data-tooltip]:before,
[data-tooltip]:after {
visibility: hidden;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=0);
opacity: 0;
pointer-events: none;
}

/* Position tooltip above the element */
[data-tooltip]:before {
position: absolute;
top: 150%;
left: 50%;
margin-bottom: 5px;
margin-left: -80px;
padding: 7px;
width: relative;
-webkit-border-radius: 3px;
-moz-border-radius: 3px;
border-radius: 3px;
background-color: #000;
background-color: hsla(0, 0%, 20%, 0.9);
color: #fff;
content: attr(data-tooltip);
text-align: center;
font-size: 14px;
line-height: 1.2;
z-index: 100;
}

/* Triangle hack to make tooltip look like a speech bubble */
[data-tooltip]:after {
position: absolute;
top: 132%;
left: relative;
width: 0;
border-bottom: 5px solid #000;
border-bottom: 5px solid hsla(0, 0%, 20%, 0.9);
border-right: 5px solid transparent;
border-left: 5px solid transparent;
content: " ";
font-size: 0;
line-height: 0;
}

/* Show tooltip content on hover */
[data-tooltip]:hover:before,
[data-tooltip]:hover:after {
visibility: visible;
-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=100);
opacity: 1;
}

blink, .blink {
-webkit-animation: blink 2s step-end infinite;
-moz-animation: blink 2s step-end infinite;
-o-animation: blink 2s step-end infinite;
animation: blink 2s step-end infinite;
}

@-webkit-keyframes blink {
67% { opacity: 0 }
}

@-moz-keyframes blink {
67% { opacity: 0 }
}

@-o-keyframes blink {
67% { opacity: 0 }
}

@keyframes blink {
67% { opacity: 0 }
}

.titleEditBox:hover {
	box-shadow: inset 0 0 20px #ebbc4a;
}

.titleEditBox:active {
	box-shadow: inset 0 0 15px 2px white;
}

.alertify .dialog .msg {
color: black;
}
.alertify-logs > .default {
    background-image: url(/img/ingress-background-dark.png) !important;
}

.btn-xs {
padding: 1px 5px !important;
}

`;

const PORTAL_MARKER = "data:image/PNG;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABGdBTUEAALGPC/xhBQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAAd0SU1FB+EHEAccLVUS/qUAAAI0SURBVDjLldTNa55VEAXw39zniTGRqvEDUqOLiEGKKEELbcS9IG79AxSJqCju3MZ/oNhFwFZtEZeKS1FKXRgRLVK6qSVoGkWbCkbRlHy8b/I+46K3sYg1eJZ35p4599yZCf9AfoH3NQZuUrRCCzo72NHo6xnESRJR77WQs8TxevKeceEx4TCmpEkQfsCSzleGfJOsBPIZ4oO/CeULijCGV3RekkaEgnItReqETbyt86ZFq7Gg21VU0yZ1jgozGBbOS5eE1Upyl3APHpJeVBx0wGsWfAuRiVkTilnpdfwpfC19h560U3W3OkMaUzqHhDuFI1rz5v3UzK1r9T0pvSHcjNM4j00MhHTV14GwjVVsCFPSI9IFj1os1tyCGaGVzgoXse3G2MEyzgpFelyxrwjDeBADLEtb9kLoScvoC5PCSJGG8QA6rEgDe6MTLmNLZ0XqlWpk4/8j0QqHdG4t1cCfhcDYdX3zXxSBO6qAdY1BMaQvLUkN7q1NuJdHRZpAK32PzeJ36zhT60zjvj2e2mBCmK7FzwhXio/0tT4XPsbdmKnVyr8oCezHDMYVp7Q+86uNNjZlXrJowryBg7hfGJXOKS7r/FZJxqT9mMa4dBFvCRfiQxnXpjdfNWrLE3gWT0sbdUB7Vc8wRjAqfKpzQmch3nUlZ+v058vE/O4WeBhPSYdrf01Woh+lJXyp+CSOOQf5PPHOdWtk92efU4zYZ9s4bpduq6E16Q+NX7AWx3Q5R8xdDf4FFQPK0NE5za8AAAAASUVORK5CYII=";

//endregion
