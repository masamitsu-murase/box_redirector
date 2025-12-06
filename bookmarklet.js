(function() {
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

    var convertFullPathToBoxPath = function(pathParam) {
        const patterns = constructFilePathPrefixPatterns();
        for (const pattern of patterns) {
            if (pattern.test(pathParam)) {
                return pathParam.replace(pattern, "");
            }
        }
        throw new Error("The specified path is not a Box folder path.");
    };

    var findBoxPath = function(urlText) {
        const url = new URL(urlText);
        const originalPath = url.searchParams.get("path");
        const boxPath = convertFullPathToBoxPath(originalPath);
        return boxPath;
    };

    var main = async function(urlText) {
        try {
            const href = new URL(window.location.href);
            if (!href.hostname.endsWith(".box.com")) {
                throw new Error("This script should be run on box.com domain.");
            }

            let boxPath = null;
            if (urlText) {
                try {
                    boxPath = findBoxPath(urlText);
                } catch (e) {
                }
            }

            if (!boxPath) {
                urlText = prompt("Enter the URL to process:", "");
                boxPath = findBoxPath(urlText);
            }

            const boxPathInfo = await findBoxPathInfo(boxPath);
            window.location.href = "/" + encodeURIComponent(boxPathInfo.type) + "/" + encodeURIComponent(boxPathInfo.id);
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    // if (navigator.clipboard && navigator.clipboard.readText) {
    //     navigator.clipboard.readText().then(function(text) {
    //         main(text);
    //     }).catch(function() {
    //         main(null);
    //     });
    // } else {
    //     main(null);
    // }
    main(null);
})();
