# ![Box Redirector](./extension/images/logo.png) Box Redirector

## Overview

Box Redirector is a browser extension that enables seamless integration between Box Drive and the Box web application.

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

## License

See [LICENSE.txt](./LICENSE.txt).
