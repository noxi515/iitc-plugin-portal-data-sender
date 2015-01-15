// ==UserScript==
// @id             iitc-plugin-portal-data-sender@noxi515
// @name           IITC plugin: Portal Data Sender
// @category       Controls
// @version        0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    TODO
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () {
    };


// PLUGIN START ////////////////////////////////////////////////////////

    // Constants
    window.plugin.portalDataSender = {
        "SERVER_URL": "https://127.0.0.1:8080/portal",
        "PULL_SIZE": 1000,
        "ENABLE_ASYNC": true,
        "data": {}
    };

    /**
     * IITCのportalAddedフック
     *
     * @param marker
     */
    window.plugin.portalDataSender.onPortalAdded = function (marker) {
        var portal = {
            "guid": marker.portal.options.guid,
            "title": marker.portal.options.data.title,
            "image": marker.portal.options.data.image,
            "lat": marker.portal.options.data.latE6,
            "lng": marker.portal.options.data.lngE6
        };
        var data = window.plugin.portalDataSender.data;
        if (data.hasOwnProperty(portal.guid))
            return;

        data[portal.guid] = portal;
        if (data.length == window.plugin.portalDataSender.PULL_SIZE)
            window.plugin.portalDataSender.executeRequest();
    };

    /**
     * IITCのmapDataRefreshEndフック
     */
    window.plugin.portalDataSender.onMapDataRefreshEnd = function () {
        window.plugin.portalDataSender.executeRequest();
    };

    /**
     * データ送信部分
     */
    window.plugin.portalDataSender.executeRequest = function () {
        var data = window.plugin.portalDataSender.data;

        // Reset data
        window.plugin.portalDataSender = {};

        var list = [];
        for (var key in data) {
            if (data.hasOwnProperty(key))
                list.push(data[key]);
        }

        var request = new XMLHttpRequest();
        request.open('POST', window.plugin.portalDataSender.SERVER_URL, window.plugin.portalDataSender.ENABLE_ASYNC);

        var form = new FormData();
        form.append('data', JSON.stringify({"portals": list}));

        request.send(form);
    };

    var setup = function () {
        alert('setup');
        window.addHook('portalAdded', window.plugin.portalDataSender.onPortalAdded);
        window.addHook('mapDataRefreshEnd', window.plugin.portalDataSender.onMapDataRefreshEnd);
    };
    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins)
        window.bootPlugins = [];
    window.bootPlugins.push(setup);

    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end

// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
};
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);