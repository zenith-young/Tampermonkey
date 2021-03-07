// ==UserScript==
// @name         债权通 商城助手
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  仅用于抢购债权通商城爆款商品
// @author       Anonymous
// @match        https://web.meiduzaixian.com/mall/mall-app/mall-web/index.html
// @connect      meiduzaixian.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/moment.js/2.29.1/moment.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// ZhaiQuanTong Basic

var createOptionsRequestHeader = function () {
    return {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Mobile Safari/537.36",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "channel,content-type,x-appuuid,x-bangbang-deviceagent,x-channel,x-channel-source,x-credit-token,x-deviceid,x-pageuuid,x-phonetype,x-platform,x-proid,x-shengce-distinctid,x-sysversion,x-time,x-timezone,x-token,x-token-sign,x-useragent,x-usertraceid,x-version",
        "X-Requested-With": "com.jfphamc.app",
    };
};

var createPostRequestHeader = function () {

    var sensorsdata2015jssdkcross = $.cookie("sensorsdata2015jssdkcross");
    var distinctId = JSON.parse(sensorsdata2015jssdkcross).distinct_id;

    var token = $.cookie("token");
    var xTokenSign = $.cookie("xTokenSign");

    return {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Mobile Safari/537.36 jfwklc;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:103;packageName:com.jfphamc.app",
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

var ajax = function (method, url, headers, data) {
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: headers,
            data: (data === undefined) ? "" : JSON.stringify(data),
            onerror: function (err) {
                showLog("Failed to execute " + method + " " + url);
                showLog(err);
                reject(err);
            },
            onload: function (result) {
                showLog("Succeeded in executing " + method + " " + url);
                if (result.response === undefined) {
                    resolve(result);
                } else {
                    resolve(JSON.parse(result.response));
                }
            },
        });
    });
};

var options = function (url) {
    return ajax("OPTIONS", url, createOptionsRequestHeader(), undefined);
};

var post = function (url, data) {
    return ajax("POST", url, createPostRequestHeader(), data);
};

var enhancedPost = function (url, data) {
    return options(url).then(function (r1) {
        return post(url, data);
    });
};

// ZhaiQuanTong APIs

var API_isSign = function () {
    var url = "https://mall.meiduzaixian.com/mall/order/trade/isSign";
    var data = {};
    return enhancedPost(url, data);
};

var API_getHomePageNew = function () {
    var url = "https://mall.meiduzaixian.com/operation/operate/home/getHomePageNew";
    var data = {
        cityCode: 110100,
    };
    return enhancedPost(url, data);
};

var API_getRecommendInfo = function () {
    var url = "https://mall.meiduzaixian.com/operation/operate/home/getRecommendInfo";
    var data = {
        cityCode: 110100,
        floorId: 23,
        floorType: "55",
        isExpert: "0",
        lat: "39.90",
        lon: "116.38",
        pageNo: "1",
        pageSize: 10,
        sort: 1,
    };
    return enhancedPost(url, data);
};

var API_detail = function (sku, productSourceType) {
    var url = "https://mall.meiduzaixian.com/mall/product/locallife/detail";
    var data = {
        sku: sku,
        productSourceType: productSourceType,
    };
    return enhancedPost(url, data);
};

var API_queryByUserIdAndAddressId = function () {
    var url = "https://mall.meiduzaixian.com/platform/ui/user/recAddress/queryByUserIdAndAddressId";
    var data = {
        addressId: "",
    };
    return enhancedPost(url, data);
};

var API_productInfoV2 = function (sku, productSourceType) {
    var url = "https://mall.meiduzaixian.com/mall/order/product/productInfoV2";
    var data = {
        activityInfo: {},
        busType: "01",
        productCount: "1",
        productInfoNo: "",
        productSourceType: productSourceType,
        shopId: "null",
        sku: sku,
    };
    return enhancedPost(url, data);
};

var API_doConfirmOrderV2 = function (data) {
    var url = "https://mall.meiduzaixian.com/mall/order/trade/doConfirmOrderV2";
    return enhancedPost(url, data);
};

// Global Variables

var REQUEST_TIMEOUT = 200;

var defaultAddress = undefined;
var baoKuanProductDetails = [];

var getBaoKuanProductDetail = function (sku) {
    for (var i = 0; i < baoKuanProductDetails.length; i++) {
        var detail = baoKuanProductDetails[i];
        if (detail.sku === sku) {
            return detail;
        }
    }
    return null;
};

// Injected Functions - Monitor BaoKuan List

var Monitor_GetHomePageNew = function () {
    API_getHomePageNew().then(function (response) {
        if (response.status !== "000000") {
            showLog(response);
            setTimeout(Monitor_GetHomePageNew, REQUEST_TIMEOUT);
            return;
        }
        var floors = response.result.floors;
        for (var i = 0; i < floors.length; i++) {
            if (floors[i].floorType === "57") {
                handleBaoKuanList(floors[i]);
                break;
            }
        }
    }, function (err) {
        showLog(err);
        setTimeout(Monitor_GetHomePageNew, REQUEST_TIMEOUT);
    });
};

var handleBaoKuanList = function (floor) {

    showLog(floor);

    for (var i = 0; i < floor.details.length; i++) {

        var linkUrl = floor.details[i].linkUrl;
        var sku = getParamValue(linkUrl, "sku");
        var productSourceType = getParamValue(linkUrl, "productSourceType");

        if (getBaoKuanProductDetail(sku) !== null) {
            continue;
        }

        showLog(floor.details[i]);

        baoKuanProductDetails.push({
            linkUrl: linkUrl,
            sku: sku,
            productSourceType: productSourceType,
            detail: undefined,
            productInfo: undefined,
            orderSuccess: false,
        });

        setTimeout(Monitor_Detail, REQUEST_TIMEOUT, sku, productSourceType);
    }

    setTimeout(Monitor_GetHomePageNew, REQUEST_TIMEOUT);
};

// Injected Functions - Monitor Detail

var Monitor_Detail = function (sku, productSourceType) {
    API_detail(sku, productSourceType).then(function (response) {
        if (response.status !== "000000") {
            showLog(response);
            setTimeout(Monitor_Detail, REQUEST_TIMEOUT, sku, productSourceType);
            return;
        }
        showLog(response.result);
        var productDetail = getBaoKuanProductDetail(sku);
        if (productDetail.detail === undefined) {
            productDetail.detail = response.result;
        }
        setTimeout(Monitor_ProductInfoV2, REQUEST_TIMEOUT, sku, productSourceType);
        // productName
        // inventory
        // payNeedGoldenBean
    }, function (err) {
        showLog(err);
        setTimeout(Monitor_Detail, REQUEST_TIMEOUT, sku, productSourceType);
    });
};

// Injected Functions - Monitor Product Info

var Monitor_ProductInfoV2 = function (sku, productSourceType) {
    API_productInfoV2(sku, productSourceType).then(function (response) {
        if (response.status !== "000000") {
            showLog(response);
            setTimeout(Monitor_ProductInfoV2, REQUEST_TIMEOUT, sku, productSourceType);
            return;
        }
        showLog(response.result);
        var productDetail = getBaoKuanProductDetail(sku);
        if (productDetail.productInfo === undefined) {
            productDetail.productInfo = response.result;
        }
        setTimeout(Monitor_DoConfirmOrderV2, REQUEST_TIMEOUT, sku, productSourceType);
    }, function (err) {
        showLog(err);
        setTimeout(Monitor_ProductInfoV2, REQUEST_TIMEOUT, sku, productSourceType);
    });
};

// Injected Functions - Monitor Confirm Order

var Monitor_DoConfirmOrderV2 = function (sku, productSourceType) {

    var productDetail = getBaoKuanProductDetail(sku);
    if (productDetail.orderSuccess === true) {
        return;
    }

    var r1 = productDetail.detail;
    var r2 = productDetail.productInfo;

    var data = {
        activityInfo: {},
        actualAmount: "0.00",
        busType: "01",
        cashAmount: r1.payNeedGoldenBean.toString(),
        cashCouponSms: "",
        invoiceInfo: (r2.invoiceInfo === null || r2.invoiceInfo === undefined) ? {} : r2.invoiceInfo,
        mobile: "",
        payType: 0,
        pluStatus: r2.pluStatus,
        productInfoNo: "",
        productSourceType: productSourceType,
        shopList: r2.shopList,
        userAddressInfo: defaultAddress,
    };

    API_doConfirmOrderV2(data).then(function (r3) {
        if (r3.success === true) {
            showLog("", true);
            showLog("成功下单：" + r1.productName, true);
            showLog("商品链接：" + productDetail.linkUrl, true);
            productDetail.orderSuccess = true;
        } else {
            showLog(r3);
            setTimeout(Monitor_DoConfirmOrderV2, REQUEST_TIMEOUT, sku, productSourceType);
        }
    }, function (err) {
        showLog(err);
        setTimeout(Monitor_DoConfirmOrderV2, REQUEST_TIMEOUT, sku, productSourceType);
    });
};

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

    API_queryByUserIdAndAddressId().then(function (response) {

        defaultAddress = response.result.address;
        defaultAddress.allAddress = defaultAddress.province + "\n          " + defaultAddress.city + "\n          " + defaultAddress.area + "\n          " + defaultAddress.county + "\n          " + defaultAddress.address;
        defaultAddress.receiverAddress = defaultAddress.address;
        defaultAddress.receiverAddressId = defaultAddress.id;

        setTimeout(Monitor_GetHomePageNew, REQUEST_TIMEOUT);
    });
});
