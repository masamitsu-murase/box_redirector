if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(function(ctx) {
    "use strict";

    var convertFullPathToBoxPath = function(pathParam) {
        const patterns = ctx.FILE_PATH_PREFIXE_PATTERNS;
        for (const pattern of patterns) {
            if (pattern.test(pathParam)) {
                return pathParam.replace(pattern, "");
            }
        }
        throw new Error("The specified path is not a Box folder path.");
    };

    var onLoad = function() {
        (async function() {
            try {
                const url = new URL(window.location.href);
                const pathParamName = await ctx.getStorageData("settings.target_param");
                const pathParam = url.searchParams.get(pathParamName);
                if (!pathParam) {
                    throw new Error("No path parameter specified.");
                }

                const boxPath = convertFullPathToBoxPath(pathParam);

                let newUrl = new URL("http://app.box.com/folder/0");
                newUrl.searchParams.set(ctx.PATH_PARAMETER_NAME, boxPath);
                window.location.href = newUrl.href;
            } catch (e) {
                document.getElementById("output").textContent = "Error: " + e.message;
                console.error(e);
            }
        })();
    };

    document.addEventListener("DOMContentLoaded", onLoad);
})(BoxRedirector);
