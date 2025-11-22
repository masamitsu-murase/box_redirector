if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(function(ctx) {
    "use strict";

    const PATH_PARAMETER_NAME = "box_redirector_path";
    const BOX_DOMAIN_SUFFIX = ".box.com";

    var constructFilePathPrefixPatterns = function() {
        const strFilePathPrefixes = [
            "%USERPROFILE%\\Box\\",
            "%USERPROFILE%/Box/",
        ];
        let filePathPrefixePatterns = [];
        for (const prefix of strFilePathPrefixes) {
            filePathPrefixePatterns.push(
                new RegExp(`^${RegExp.escape(prefix)}`)
            );
        }
        filePathPrefixePatterns.push(
            new RegExp(`^${RegExp.escape("C:\\Users\\")}[^\\\\]+${RegExp.escape("\\Box\\")}`)
        );
        filePathPrefixePatterns.push(
            new RegExp(`^${RegExp.escape("C:/Users/")}[^/]+${RegExp.escape("/Box/")}`)
        );
    
        return filePathPrefixePatterns;
    }

    var getStorageData = async function(key, defaultValue) {
        const result = await browser.storage.local.get([key]);
        return result[key] !== undefined ? result[key] : defaultValue;
    };

    var setDynamicRules = async function (useTargetUrl, targetUrl, targetParam, boxUrl, boxParam) {
        const invalidUrlChars = ['*', '|', '^'];  // Special for urlFilter
        const paramPattern = /^[-_a-z0-9]+$/i;

        if (useTargetUrl) {
            if (invalidUrlChars.some(char => targetUrl.includes(char))) {
                throw new Error(`Invalid targetUrl: ${targetUrl}`);
            }
            if (!paramPattern.test(targetParam)) {
                throw new Error(`Invalid targetParam: ${targetParam}`);
            }
        }
        if (invalidUrlChars.some(char => boxUrl.includes(char))) {
            throw new Error(`Invalid boxUrl: ${boxUrl}`);
        }
        if (!paramPattern.test(boxParam)) {
            throw new Error(`Invalid boxParam: ${boxParam}`);
        }

        const REDIRECTOR_PAGE = "html/" + browser.i18n.getMessage("redirector_page");
        const REDIRECTOR_URL = new URL(browser.runtime.getURL(REDIRECTOR_PAGE));
        const transform = {
            scheme: REDIRECTOR_URL.protocol.replace(":", ""),
            host: REDIRECTOR_URL.hostname,
            port: "",
            username: "",
            password: "",
            path: REDIRECTOR_URL.pathname,
            // Keep query values.
        };

        let rules = [];
        if (useTargetUrl) {
            var url = new URL(targetUrl);
            const urlFilter1 = `|${url.protocol}//${url.hostname}*?${targetParam}=`;
            const urlFilter2 = `|${url.protocol}//${url.hostname}*?*&${targetParam}=`;
            rules = rules.concat([
                {
                    id: 1,
                    priority: 1,
                    condition: {
                        urlFilter: urlFilter1,
                        resourceTypes: ["main_frame"],
                    },
                    action: {
                        type: "redirect",
                        redirect: { transform: transform }
                    }
                },
                {
                    id: 2,
                    priority: 2,
                    condition: {
                        urlFilter: urlFilter2,
                        resourceTypes: ["main_frame"],
                    },
                    action: {
                        type: "redirect",
                        redirect: { transform: transform }
                    }
                },
            ]);
        }

        var box = new URL(boxUrl);
        const urlFilter3 = `|${box.protocol}//${box.hostname}*?${boxParam}=`;
        const urlFilter4 = `|${box.protocol}//${box.hostname}*?*&${boxParam}=`;
        rules = rules.concat([
            {
                id: 3,
                priority: 100,
                condition: { urlFilter: urlFilter3, },
                action: { type: "allow", }
            },
            {
                id: 4,
                priority: 101,
                condition: { urlFilter: urlFilter4, },
                action: { type: "allow", }
            },
        ]);
        console.info(rules);

        const currentRules = await browser.declarativeNetRequest.getDynamicRules();
        const currentRuleIds = currentRules.map(rule => rule.id);
        browser.declarativeNetRequest.updateDynamicRules({
            addRules: rules,
            removeRuleIds: currentRuleIds,
        });
    };

    var setBoxRedirectorRules = async function() {
        const useTargetUrl = await ctx.getStorageData("settings.use_target_url");
        const targetUrl = await ctx.getStorageData("settings.target_url");
        const targetParam = await ctx.getStorageData("settings.target_param");
        const boxUrl = await ctx.getStorageData("settings.box_url");
        const boxParam = ctx.PATH_PARAMETER_NAME;
        await setDynamicRules(
            useTargetUrl,
            targetUrl,
            targetParam,
            boxUrl,
            boxParam
        );
    };

    ctx.PATH_PARAMETER_NAME = PATH_PARAMETER_NAME;
    ctx.BOX_DOMAIN_SUFFIX = BOX_DOMAIN_SUFFIX;
    ctx.FILE_PATH_PREFIXE_PATTERNS = constructFilePathPrefixPatterns();
    ctx.getStorageData = getStorageData;
    ctx.setBoxRedirectorRules = setBoxRedirectorRules;
})(BoxRedirector);
