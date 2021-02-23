// ==UserScript==
// @name         ZhaiQuanTong Monitor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script for monitoring ZhaiQuanTong's products
// @author       You
// @match        https://web.meiduzaixian.com/mall/mall-app/mall-web/index.html
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/moment.js/2.29.1/moment.min.js
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

var API_isSign = function () {
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

var API_getHomePageNew = function () {
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

var API_getRecommendInfo = function () {
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

var API_detail = function (sku, productSourceType) {
    GM_xmlhttpRequest({
        method: "POST",
        url: "https://mall.meiduzaixian.com/mall/product/locallife/detail",
        data: JSON.stringify({
            sku: sku,
            productSourceType: productSourceType,
        }),
        headers: createRequestHeader(),
        onerror: function (err) {
            showLog("Failed to execute detail");
            showLog(err);
        },
        onload: function (result) {
            showLog("Succeeded in executing detail");
            onDetailReceived(JSON.parse(result.response));
        },
    });
}

// Callback Functions

var onIsSignReceived = function (response) {
    showLog(response);
};

var onHomePageNewReceived = function (response) {
    showLog("API_getHomePageNew count: " + ++API_getHomePageNew_count);
    if (response.status !== "000000") {
        showLog(response);
        return;
    }
    var floors = response.result.floors;
    for (var i = 0; i < floors.length; i++) {
        if (floors[i].floorType === "57") {
            handleBaoKuanFloor(floors[i]);
            break;
        }
    }
};

var onRecommendInfoReceived = function (response) {
    showLog(response);
};

var onDetailReceived = function (response) {
    showLog("API_detail count: " + ++API_detail_count);
    if (response.status !== "000000") {
        showLog(response);
        return;
    }
    handleBaoKuanDetail(response.result);
};

// Injected Functions

var handleBaoKuanFloor = function (floor) {

    showLog(floor);

    for (var i = 0; i < floor.details.length; i++) {
        var linkUrl = floor.details[i].linkUrl;
        var sku = getParamValue(linkUrl, "sku");
        var productSourceType = getParamValue(linkUrl, "productSourceType");
        if (getBaoKuanProductDetail(sku) !== null) {
            continue;
        }
        baoKuanProductDetails.push({
            linkUrl: linkUrl,
            sku: sku,
            productSourceType: productSourceType,
            inventory: undefined,
        });
        showLog(baoKuanProductDetails, true);
        setInterval(API_detail, REQUEST_INTERVAL, sku, productSourceType);
    }

    setTimeout(API_getHomePageNew, REQUEST_TIMEOUT);
};

var handleBaoKuanDetail = function (detail) {

    showLog(detail);

    var productDetail = getBaoKuanProductDetail(detail.sku);
    var existedInventory = productDetail.inventory;
    var newInventory = detail.inventory;
    var inventoryStatus = undefined;

    if (existedInventory === undefined && newInventory === 0) {
        inventoryStatus = "一开始就没货";
    } else if (existedInventory !== newInventory && newInventory > 0) {
        inventoryStatus = "有货";
    } else if (existedInventory !== newInventory && newInventory === 0) {
        inventoryStatus = "刚刚卖光了";
    }
    if (inventoryStatus !== undefined) {
        showLog("", true);
        showLog("商品：" + detail.productName, true);
        showLog("库存状态：" + inventoryStatus, true);
        showLog("库存：" + newInventory, true);
        showLog("售价：" + detail.payNeedGoldenBean + " 金币", true);
        showLog("当前时间：" + moment().format("YYYY-MM-DD HH:mm:ss.SSS"), true);
    }

    productDetail.inventory = newInventory;
}

var getBaoKuanProductDetail = function (sku) {
    for (var i = 0; i < baoKuanProductDetails.length; i++) {
        var detail = baoKuanProductDetails[i];
        if (detail.sku === sku) {
            return detail;
        }
    }
    return null;
};

// Global Variables & Getter/Setter

var REQUEST_TIMEOUT = 10;
var REQUEST_INTERVAL = 500;

var baoKuanProductDetails = [];

var API_getHomePageNew_count = 0;
var API_detail_count = 0;

// Utils

var showLog = function (obj, enableLog = false) {
    if (!enableLog) {
        return;
    }
    if (typeof(obj) === "string") {
        console.log("[Tampermonkey]: " + obj);
    } else {
        console.log("[Tampermonkey]:");
        console.log(obj);
    }
};

var getParamValue = function (url, key) {
    var params = url.split("?")[1].split("&");
    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        if (param[0] === key) {
            return unescape(param[1]);
        }
    }
    return null;
};

// Main

$(function() {
    'use strict';

    setTimeout(API_getHomePageNew, REQUEST_TIMEOUT);
});
