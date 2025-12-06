if (typeof BoxRedirector === "undefined") globalThis.BoxRedirector = {};
if (typeof browser === "undefined") globalThis.browser = chrome;

(async function(ctx) {
    "use strict";

    // https://app.box.com/app-api/enduserapp/folder/350222452533?format=minimal
    // https://app.box.com/app-api/enduserapp/folder/0?format=minimal&itemOffset=65&pageSize=21&paginationMode=offset
    // https://app.box.com/app-api/enduserapp/folder/352871851123?format=minimal&marker=eyJ0eXBlIjoiZm...=&pageSize=20&paginationMode=marker
    const API_BASE = "/app-api/enduserapp";

    console.log("Box Redirector content script loaded.");

    var getNextUrl = function(itemInfo, paginationMode, offset, perPage) {
        let url = new URL(`${API_BASE}/folder/${itemInfo.folder.id}`, "http://example.com");
        url.searchParams.append('format', 'minimal');
        url.searchParams.append('pageSize', perPage);
        if (paginationMode === 'marker') {
            url.searchParams.append('marker', itemInfo.nextMarker);
            url.searchParams.append('paginationMode', 'marker');
        } else if (paginationMode === 'offset') {
            url.searchParams.append('itemOffset', offset);
            url.searchParams.append('paginationMode', 'offset');
        } else {
            throw new Error("Unknown pagination mode.");
        }
        return url.pathname + url.search;
    };

    var findItemInFolder = async function(targetItemName, folderId) {
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
            const paginationMode = (itemInfo.nextMarker ? 'marker' : 'offset');
            while (offset < folderItemCount) {
                const nextUrl = getNextUrl(itemInfo, paginationMode, offset, PER_PAGE);
                const itemInfoResponse = await fetch(nextUrl);
                if (!itemInfoResponse.ok) {
                    throw new Error(`Failed to fetch more items for folder ID ${folderId}.`);
                }

                itemInfo = await itemInfoResponse.json();
                targetItem = itemInfo.items.find(entry => entry.name === targetItemName);
                if (targetItem) {
                    return targetItem;
                }
                if (paginationMode === 'marker') {
                    if (!itemInfo.nextMarker) {
                        break;
                    }
                } else if (paginationMode === 'offset') {
                    if (itemInfo.items.length < PER_PAGE) {
                        break;
                    }
                } else {
                    throw new Error("Unknown pagination mode.");
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
