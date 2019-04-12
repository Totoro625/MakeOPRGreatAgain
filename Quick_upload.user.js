// ==UserScript==
// @id			 Quick upload
// @name         Quick upload
// @version      0.34-modify-1.0
// @description  提交并进入下一个
// @updateURL
// @downloadURL
// @author       jqqqqqqqqqq | modify by totoro625
// @match        https://opr.ingress.com/recon
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// @supportURL   https://totoro.ink
// @grant        unsafeWindow
// ==/UserScript==



var buttons = [
];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////DO NOT EDIT THIS LINE BELOW!
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const w = typeof unsafeWindow == "undefined" ? window : unsafeWindow;



var button_list = {
    'total': [],
};

function update_button_list(){
    $(".button-star").each(function(){  // use mouse hover to select stars
        switch($(this).attr("ng-model")) {
            case "answerCtrl.formData.quality":
                button_list['total'].push($(this));
                $(this).css({'margin-bottom': '10px'});
                $(this).children('span').css({'font-size': '42px'});
                $(this).css({'margin-left': '5px'});
                $(this).css({'margin-right': '5px'});
                break;
        }

    });
}
function add_button() {
    var button_region = document.getElementById("submitDiv");
    buttons.forEach(function(button_data) {
        var button = document.createElement("button");
        var textnode = document.createTextNode(button_data["button"]);
    });
    w.$scope = element => w.angular.element(element).scope();
    var submitAndNext = document.createElement("button");
    submitAndNext.className = "button submit-button";
    submitAndNext.innerHTML = `<font size="6"><span class="glyphicon glyphicon-floppy-disk"></span>&nbsp;<span class="glyphicon glyphicon-forward"></span> | 提交</font>`;
    submitAndNext.title = "提交并进入下一个";
    submitAndNext.addEventListener("click", function() {angular.element(document.getElementById('AnswersController')).scope().answerCtrl.submitForm();setTimeout(function(){ window.location.assign("/recon");}, 1000);});
    button_region.insertBefore(submitAndNext, null);
}
(function() {
    add_button();
    update_button_list();
})();