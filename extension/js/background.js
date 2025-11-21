if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

import "./common.js";

(function(ctx) {
    "use strict";

    browser.runtime.onInstalled.addListener(function(details) {
        (async function () {
            try {
                if (details.reason === "install") {
                    await browser.storage.local.set({
                        "settings.use_target_url": false,
                        "settings.target_url": "http://localhost:5000/",
                        "settings.target_param": "path",
                        "settings.box_url": "https://app.box.com/folder/0",
                    });
                    await ctx.setBoxRedirectorRules();
                    await browser.runtime.openOptionsPage();
                }
            } catch (e) {
                console.error(e);
            }
        })();
    });

    browser.runtime.onStartup.addListener(function(details) {
        (async function () {
            try {
                await setBoxRedirectorRules();
            } catch (e) {
                console.error(e);
            }
        })();
    });
})(BoxRedirector);
