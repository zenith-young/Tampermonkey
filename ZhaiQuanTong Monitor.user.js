// ==UserScript==
// @name         ZhaiQuanTong Monitor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script for monitoring ZhaiQuanTong's products
// @author       You
// @match        https://web.meiduzaixian.com/mall/mall-app/mall-web/index.html
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// ZhaiQuanTong APIs

var createRequestHeader = function () {

    var sensorsdata2015jssdkcross = $.cookie("sensorsdata2015jssdkcross");
    var distinctId = JSON.parse(sensorsdata2015jssdkcross).distinct_id;

    var token = $.cookie("token");
    var xTokenSign = $.cookie("xTokenSign");

    return {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Mobile Safari/537.36",
        "x-shengce-distinctId": distinctId,
        "x-token": token,
        "x-token-sign": xTokenSign,
        "x-version": "1.0.3",
        "x-deviceId": "_permission_refused_",
        "x-platform": "android",
        "x-proId": "jfsc_wk_android",
        "x-phoneType": "MI 8",
        "x-sysVersion": "10",
        "x-channel-source": "wklc",
        "X-Requested-With": "com.jfphamc.app",
    };
};

var isSign = function () {
    GM_xmlhttpRequest({
        method: "POST",
        url: "https://mall.meiduzaixian.com/mall/order/trade/isSign",
        data: JSON.stringify({}),
        headers: createRequestHeader(),
        onerror: function (err) {
            showLog("Failed to execute isSign");
            showLog(err);
        },
        onload: function (result) {
            showLog("Succeeded in executing isSign");
            onIsSignReceived(JSON.parse(result.response));
        },
    });
};

var getHomePageNew = function () {
    GM_xmlhttpRequest({
        method: "POST",
        url: "https://mall.meiduzaixian.com/operation/operate/home/getHomePageNew",
        data: JSON.stringify({
            cityCode: 110100,
        }),
        headers: createRequestHeader(),
        onerror: function (err) {
            showLog("Failed to execute getHomePageNew");
            showLog(err);
        },
        onload: function (result) {
            showLog("Succeeded in executing getHomePageNew");
            onHomePageNewReceived(JSON.parse(result.response));
        },
    });
};

var getRecommendInfo = function () {
    GM_xmlhttpRequest({
        method: "POST",
        url: "https://mall.meiduzaixian.com/operation/operate/home/getRecommendInfo",
        data: JSON.stringify({
            cityCode: 110100,
            floorId: 23,
            floorType: "55",
            isExpert: "0",
            lat: "39.90",
            lon: "116.38",
            pageNo: "1",
            pageSize: 10,
            sort: 1,
        }),
        headers: createRequestHeader(),
        onerror: function (err) {
            showLog("Failed to execute getRecommendInfo");
            showLog(err);
        },
        onload: function (result) {
            showLog("Succeeded in executing getRecommendInfo");
            onRecommendInfoReceived(JSON.parse(result.response));
        },
    });
};

// Callback Functions

var onIsSignReceived = function (response) {
    showLog(response);
};

var onHomePageNewReceived = function (response) {
    if (response.status !== "000000") {
        showLog(response);
        return;
    }
    var floors = response.result.floors;
    for (var i = 0; i < floors.length; i++) {
        if (floors[i].floorType === "57") {
            handleFloorBaoKuan(floors[i]);
            break;
        }
    }
};

var onRecommendInfoReceived = function (response) {
    showLog(response);
};

// Injected Functions

var handleFloorBaoKuan = function (floor) {

    showLog("Catch it!");
    showLog("-> title: " + floor.title);
    showLog("-> count: " + floor.details.length);

    var details = floor.details;
    for (var i = 0; i < details.length; i++) {
        var linkUrl = details[i].linkUrl;
        // TODO:
    }
}

// Utils

var showLog = function (obj) {
    if (typeof(obj) === "string") {
        console.log("[Tampermonkey]: " + obj);
    } else {
        console.log("[Tampermonkey]:");
        console.log(obj);
    }
};

// Main

$(function() {
    'use strict';

    getHomePageNew();
});
