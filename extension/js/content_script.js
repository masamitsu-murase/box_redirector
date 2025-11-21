if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(async function(ctx) {
    "use strict";

    console.log("Box Redirector content script loaded.");

    var findBoxPathInfo = async function(boxPath) {
        // https://app.box.com/app-api/enduserapp/folder/350222452533?format=minimal
        const API_BASE = "/app-api/enduserapp"

        const boxPathItems = boxPath.split(/[/\\]/).filter(part => part.length > 0);
        if (boxPathItems.length === 0) {
            throw new Error("The specified Box path is invalid.");
        }

        let currentId = "0";  // Root folder ID
        let currentItem = null;
        for (const itemName of boxPathItems) {
            const response = await fetch(`${API_BASE}/folder/${currentId}?format=minimal`);
            if (!response.ok) {
                throw new Error(`Failed to fetch folder info for ID ${currentId}.`);
            }

            const itemInfo = await response.json();
            currentItem = itemInfo.items.find(entry => entry.name === itemName);
            if (!currentItem) {
                throw new Error(`Folder "${itemName}" not found in "${itemInfo.name}".`);
            }

            currentId = currentItem.id;
        }

        return currentItem;
    };

    const url = new URL(window.location.href);
    const boxPath = url.searchParams.get(ctx.PATH_PARAMETER_NAME);
    if (!boxPath) {
        return;
    }

    try {
        const boxPathInfo = await findBoxPathInfo(boxPath);
        window.location.href = `/${boxPathInfo.type}/${boxPathInfo.id}`;
    } catch (e) {
        console.error(e);
    }
})(BoxRedirector);
