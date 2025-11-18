if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(function() {
    "use strict";

    location.href = browser.i18n.getMessage("option_page");
})();
