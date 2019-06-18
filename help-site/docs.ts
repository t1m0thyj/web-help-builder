/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

const isInIframe: boolean = window.location !== window.parent.location;
const links: any = document.getElementsByTagName("a");

for (const link of links) {
    if (link.host !== window.location.host) {
        link.setAttribute("target", "_blank");
    } else if (isInIframe) {
        link.setAttribute("onclick", "window.parent.postMessage(this.href, '*'); return true;");
    }
}

function setTooltip(btn: any, message: string) {
    btn.setAttribute("aria-label", message);
    btn.setAttribute("data-balloon-visible", "");
    setTimeout(() => {
        btn.removeAttribute("aria-label");
        btn.removeAttribute("data-balloon-visible");
    }, 1000);
}

const clipboard = new ClipboardJS(".btn-copy");
clipboard.on("success", (e) => setTooltip(e.trigger, "Copied!"));
clipboard.on("error", (e) => setTooltip(e.trigger, "Failed!"));
