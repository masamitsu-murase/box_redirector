# ![Box Redirector](./extension/images/logo.png) Box Redirector

## Overview

Box Redirector is a browser extension that enables seamless integration between Box Drive and the Box web application.

https://github.com/user-attachments/assets/60018678-9c02-4646-b7d0-481dbac62ec1

## Details

### Redirection of a path in Box web application

This extension redirects you to the page for the item specified by the path in the Box web application, as indicated by the `box_redirector_path` parameter.

When you access a URL such as:

`https://app.box.com/folder/0?box_redirector_path=somefolder%2Fsample.txt`

Box Redirector automatically redirects you to the corresponding page for `somefolder/sample.txt` inside Box, allowing you to open files or folders in the Box web app directly from your local Box Drive path.

**Note:** This extension uses undocumented Box APIs. It may stop working if Box changes their service or API specifications.

### Redirection of a path in your local Box Drive

This extension also redirects you to the page for the item specified by the path in your local Box Drive, as indicated by the parameter configured in the options page.

For example, if you set the redirection URL and parameter name to `http://localhost:5000/BoxDriveOpener` and `path`, then accessing
`http://localhost:5000/BoxDriveOpener?path=C%3A%2FUsers%2Fusername%2FBox%2Fsamplefolder%2Fsample.txt`
will open the corresponding page in the Box web application.

## Bookmarklet

You can use this script as the following Bookmarklet.

```text
javascript:!function(){"use strict";const e="/app-api/enduserapp";console.log("Box Redirector content script loaded.");var o=function(o,t,n,r){let a=new URL(`${e}/folder/${o.folder.id}`,"http://example.com");if(a.searchParams.append("format","minimal"),a.searchParams.append("pageSize",r),"marker"===t)a.searchParams.append("marker",o.nextMarker),a.searchParams.append("paginationMode","marker");else{if("offset"!==t)throw new Error("Unknown pagination mode.");a.searchParams.append("itemOffset",n),a.searchParams.append("paginationMode","offset")}return a.pathname+a.search},t=async function(t,n){n=encodeURIComponent(n);const r=await fetch(`${e}/folder/${n}?format=minimal`);if(!r.ok)throw new Error(`Failed to fetch folder info for ID ${n}.`);let a=await r.json();if(a.folder&&"folder"!==a.folder.type)throw new Error(`Item with ID ${n} is not a folder.`);let i=a.items.find((e=>e.name===t));if(i)return i;const s=a.folderItemCount;if(s>a.items.length){let e=a.items.length;const r=a.nextMarker?"marker":"offset";for(;e<s;){const s=o(a,r,e,20),f=await fetch(s);if(!f.ok)throw new Error(`Failed to fetch more items for folder ID ${n}.`);if(a=await f.json(),i=a.items.find((e=>e.name===t)),i)return i;if("marker"===r){if(!a.nextMarker)break}else{if("offset"!==r)throw new Error("Unknown pagination mode.");if(a.items.length<20)break}e+=a.items.length}}throw new Error(`Item "${t}" not found in folder ID ${n}.`)},n=function(e){const o=function(){const e=["%USERPROFILE%\\Box\\","%USERPROFILE%/Box/"];let o=[];for(const t of e)o.push(new RegExp(`^${RegExp.escape(t)}`));return o.push(new RegExp(`^${RegExp.escape("C:\\Users\\")}[^\\\\]+${RegExp.escape("\\Box\\")}`)),o.push(new RegExp(`^${RegExp.escape("C:/Users/")}[^/]+${RegExp.escape("/Box/")}`)),o}();for(const t of o)if(t.test(e))return e.replace(t,"");throw new Error("The specified path is not a Box folder path.")},r=function(e){const o=new URL(e).searchParams.get("path");return n(o)};!async function(e){try{if(!new URL(window.location.href).hostname.endsWith(".box.com"))throw new Error("This script should be run on box.com domain.");let o=null;if(e)try{o=r(e)}catch(e){}o||(e=prompt("Enter the URL to process:",""),o=r(e));const n=await async function(e){const o=e.split(/[/\\]/).filter((e=>e.length>0));if(0===o.length)throw new Error("The specified Box path is invalid.");let n=0,r=null;for(const e of o)r=await t(e,n),n=r.id;return r}(o);window.location.href="/"+encodeURIComponent(n.type)+"/"+encodeURIComponent(n.id)}catch(e){console.error(e),alert(e.message)}}(null)}();
```

This is minified by [Minify JS Online](https://minify-js.com/).

## License

See [LICENSE.txt](./LICENSE.txt).
