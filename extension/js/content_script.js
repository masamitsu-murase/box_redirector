if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(async function(ctx) {
    "use strict";

    console.log("Box Redirector content script loaded.");

    var findItemInFolder = async function(targetItemName, folderId) {
        // https://app.box.com/app-api/enduserapp/folder/350222452533?format=minimal
        // https://app.box.com/app-api/enduserapp/folder/0?format=minimal&itemOffset=65&pageSize=21&paginationMode=offset
        const API_BASE = "/app-api/enduserapp";
        const PER_PAGE = 20;

        folderId = encodeURIComponent(folderId);

        const response = await fetch(`${API_BASE}/folder/${folderId}?format=minimal`);
        if (!response.ok) {
            throw new Error(`Failed to fetch folder info for ID ${folderId}.`);
        }

        let itemInfo = await response.json();
        if (itemInfo.folder && itemInfo.folder.type !== 'folder') {
            throw new Error(`Item with ID ${folderId} is not a folder.`);
        }
        let targetItem = itemInfo.items.find(entry => entry.name === targetItemName);
        if (targetItem) {
            return targetItem;
        }

        const folderItemCount = itemInfo.folderItemCount;
        if (folderItemCount > itemInfo.items.length) {
            let offset = itemInfo.items.length;
            while (offset < folderItemCount) {
                let url = new URL(`${API_BASE}/folder/${folderId}`, "http://example.com");
                url.searchParams.append('format', 'minimal');
                url.searchParams.append('itemOffset', offset);
                url.searchParams.append('pageSize', PER_PAGE);
                url.searchParams.append('paginationMode', 'offset');
                const moreItemsResponse = await fetch(url.pathname + url.search);
                if (!moreItemsResponse.ok) {
                    throw new Error(`Failed to fetch more items for folder ID ${folderId}.`);
                }

                itemInfo = await moreItemsResponse.json();
                if (itemInfo.folder && itemInfo.folder.type !== 'folder') {
                    throw new Error(`Item with ID ${folderId} is not a folder.`);
                }

                targetItem = itemInfo.items.find(entry => entry.name === targetItemName);
                if (targetItem) {
                    return targetItem;
                }
                if (itemInfo.items.length < PER_PAGE) {
                    break;
                }
                offset += itemInfo.items.length;
            }
        }

        throw new Error(`Item "${targetItemName}" not found in folder ID ${folderId}.`);
    };

    var findBoxPathInfo = async function(boxPath) {
        const boxPathItems = boxPath.split(/[/\\]/).filter(part => part.length > 0);
        if (boxPathItems.length === 0) {
            throw new Error("The specified Box path is invalid.");
        }

        let currentId = 0;  // Root folder ID
        let targetItem = null;
        for (const itemName of boxPathItems) {
            targetItem = await findItemInFolder(itemName, currentId);
            currentId = targetItem.id;
        }

        return targetItem;
    };

    const url = new URL(window.location.href);
    const boxPath = url.searchParams.get(ctx.PATH_PARAMETER_NAME);
    if (!boxPath) {
        return;
    }

    try {
        const boxPathInfo = await findBoxPathInfo(boxPath);
        window.location.href = "/" + encodeURIComponent(boxPathInfo.type) + "/" + encodeURIComponent(boxPathInfo.id);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
})(BoxRedirector);
