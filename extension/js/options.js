if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(function(ctx) {
    "use strict";

    var updateGeneratedUrls = function() {
        (async function() {
            const boxUrl = document.getElementById('box_url').value.trim();
            const boxParamName = ctx.PATH_PARAMETER_NAME;
            const sampleBoxPath = encodeURIComponent('somefolder/sample.txt');
            const redirectionUrl = document.getElementById('redirection_url').value.trim();
            const paramName = document.getElementById('parameter_name').value.trim();
            const samplePath = encodeURIComponent('C:/Users/username/Box/somefolder/sample.txt');

            let generatedRedirection = '';
            let generatedBox = '';
            if (redirectionUrl && paramName) {
                generatedRedirection = redirectionUrl + '?' + paramName + '=' + samplePath;
            }
            if (boxUrl) {
                generatedBox = boxUrl + '?' + boxParamName + '=' + sampleBoxPath;
            }
            document.getElementById('generated_box_url_with_param').textContent = generatedBox;
            document.getElementById('generated_redirection_url').textContent = generatedRedirection;
            document.getElementById('generated_box_url').textContent = generatedBox;
        })();
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        ['box_url', 'redirection_url', 'parameter_name'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateGeneratedUrls);
            }
        });

        (async function() {
            const redirectionUrl = await ctx.getStorageData("settings.target_url");
            document.getElementById('redirection_url').value = redirectionUrl;
            const parameterName = await ctx.getStorageData("settings.target_param");
            document.getElementById('parameter_name').value = parameterName;
            const boxUrl = await ctx.getStorageData("settings.box_url");
            document.getElementById('box_url').value = boxUrl;
            updateGeneratedUrls();
        })();

        // Add nav click handler for switching selected page
        var navItems = document.querySelectorAll('nav ul li');
        var articleSections = document.querySelectorAll('article > section');
        navItems.forEach(function(li, idx) {
            li.addEventListener('click', function() {
                // Remove selected from all nav items
                navItems.forEach(function(item) { item.classList.remove('selected'); });
                // Add selected to clicked nav item
                li.classList.add('selected');
                // Remove selected from all article sections
                articleSections.forEach(function(sec) { sec.classList.remove('selected'); });
                // Add selected to corresponding article section
                if (articleSections[idx]) {
                    articleSections[idx].classList.add('selected');
                }
            });
        });

        // Toggle target_url_settings visibility based on checkbox
        var useTargetUrlCheckbox = document.getElementById('use_target_url');
        var targetUrlSettingsDiv = document.getElementById('target_url_settings');
        if (useTargetUrlCheckbox && targetUrlSettingsDiv) {
            var toggleTargetUrlSettings = function() {
                if (useTargetUrlCheckbox.checked) {
                    targetUrlSettingsDiv.classList.remove('hidden');
                } else {
                    targetUrlSettingsDiv.classList.add('hidden');
                }
            };
            useTargetUrlCheckbox.addEventListener('change', toggleTargetUrlSettings);
            // Initial state
            toggleTargetUrlSettings();
        }

        // Save buttons
        const saveButtons = Array.from(document.getElementsByClassName('save_button'));
        const inputIds = ['box_url', 'redirection_url', 'parameter_name', 'use_target_url'];
        inputIds.forEach(function(id) {
            let el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.addEventListener('change', function() {
                        saveButtons.forEach(function(btn) { btn.classList.add('unsaved'); });
                    });
                } else {
                    el.addEventListener('input', function() {
                        saveButtons.forEach(function(btn) { btn.classList.add('unsaved'); });
                    });
                }
            }
        });

        saveButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const boxUrlRaw = document.getElementById('box_url').value.trim();
                const useTargetUrl = document.getElementById('use_target_url').checked;
                const redirectionUrlRaw = document.getElementById('redirection_url').value.trim();
                let urlsForPermission = [];

                try {
                    const boxUrl = new URL(boxUrlRaw);
                    if (boxUrl.protocol !== 'https:') {
                        throw new Error('Box URL must use https scheme.');
                    }
                    if (!boxUrl.hostname.endsWith(ctx.BOX_DOMAIN_SUFFIX)) {
                        throw new Error(`Box URL must be a ${ctx.BOX_DOMAIN_SUFFIX} domain.`);
                    }

                    if (useTargetUrl) {
                        const redirectionUrl = new URL(redirectionUrlRaw);
                        if (!(["http:", "https:"].includes(redirectionUrl.protocol))) {
                            throw new Error('Redirection URL must use http or https scheme.');
                        }
                        urlsForPermission.push(redirectionUrl.protocol + '//' + redirectionUrl.hostname + redirectionUrl.pathname + '*');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Invalid URL: ' + e.message);
                    return;
                }

                let promise;
                if (urlsForPermission.length === 0) {
                    promise = Promise.resolve(true);
                } else {
                    promise = browser.permissions.request({ origins: urlsForPermission });
                }

                const parameterName = document.getElementById('parameter_name').value.trim();
                promise.then(function(granted) {
                    if (!granted) {
                        throw new Error(`Permission request was denied.`);
                    }
                    return browser.storage.local.set({
                        "settings.use_target_url": useTargetUrl,
                        "settings.target_url": redirectionUrlRaw,
                        "settings.target_param": parameterName,
                        "settings.box_url": boxUrlRaw,
                    });
                }).then(function() {
                    return ctx.setBoxRedirectorRules();
                }).then(function() {
                    saveButtons.forEach(function(btn) { btn.classList.remove('unsaved'); });
                }).catch(function(error) {
                    console.error(error);
                    alert(error.message);
                });
            });
        });
    });
})(BoxRedirector);
