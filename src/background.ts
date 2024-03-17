import browser from "webextension-polyfill";
import {config} from './config.js';
import {addExtensionMessageListener, } from "./service.js";
import {Color, Status, MessageAction} from "./types.js";


const StatusColorMapping = {
    active: Color.blue,
    noauth: Color.red,
    url: Color.yellow,
    search: Color.green,
    offline: Color.gray,
};


let show = true;

async function getCurrTabId(matches = null) {
    return browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        const currTab = tabs[0];
        // @ts-ignore
        if (currTab && (!matches || matches.test(currTab.url))) {
            return currTab.id;
        }
        return undefined;
    })
}


// Open Settings Page on installation
browser.runtime.onInstalled.addListener(async () => {
    browser.storage.sync.set(config);
    browser.action.setBadgeText({text: " "});
    browser.action.setBadgeBackgroundColor({color: Color.gray}).catch(console.log);
    let url = browser.runtime.getURL("src/options/options.html");
    await browser.tabs.create({url});

    addExtensionMessageListener(MessageAction.BADGE, (data) => {
        setBadgeStatus(data.status);
        setBadgeText(data.results);
    });

    addExtensionMessageListener(MessageAction.OPEN_URL, async (data) => {
        let url = browser.runtime.getURL(data.url);
        await browser.tabs.create({url});
    });
});

// listen to event for changes from saved data in storage
browser.storage.onChanged.addListener(async (data, namespace) => {

    console.log('data changed', data);
    if (data.results) {
        let text = data.results.newValue;
        if (typeof text != "string") text = JSON.stringify(text);
        if (!text) text = " ";

        setBadgeText(text);
    }

    if (data.show) {
        show = data.show.newValue;
    }

    if (data.status) {
        setBadgeStatus(data.status.newValue);
    }
});

browser.action.onClicked.addListener((tab) => {
    console.log('clicked');
    browser.storage.sync.set({show: !show});
    // Open Obsidian Vault on extension menu button click
    // browser.storage.sync.get(['vault', 'status']).then(data => {
    //   if (data.status == "offline") fetch('obsidian://open?vault=' + data.vault);
    // })
});

async function setBadgeText(text: string) {
    const tabId = await getCurrTabId();
    browser.action.setBadgeText({text, tabId});
}

async function setBadgeColor(color: Color) {
    const tabId = await getCurrTabId();
    if (!tabId) return;
    browser.action.setBadgeBackgroundColor({color: color, tabId});
}

async function setBadgeStatus(status: Status) {
    const colorName = StatusColorMapping[status];
    setBadgeColor(colorName);
}

// -------------------------------------------------------
// Side Panel
// -------------------------------------------------------

// const GOOGLE_ORIGIN = 'https://www.google.com';

// browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
//   if (!tab.url) return;
//   const url = new URL(tab.url);
//   // Enables the side panel on google.com
//   if (url.origin === GOOGLE_ORIGIN) {
//     await browser.sidePanel.setOptions({
//       tabId,
//       path: 'side-panel/side-panel.html',
//       enabled: true
//     });
//   } else {
//     // Disables the side panel on all other sites
//     await chrome.sidePanel.setOptions({
//       tabId,
//       enabled: false
//     });
//   }
// });

// browser.runtime.onInstalled.addListener(() => {
//   browser.contextMenus.create({
//     id: 'openSidePanel',
//     title: 'Open side panel',
//     contexts: ['all']
//   });
// });

// browser.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'openSidePanel') {
//     // This will open the panel in all the pages on the current window.
//     browser.sidePanel.open({ windowId: tab.windowId });
//   }
// });

// const welcomePage = 'sidepanels/welcome-sp.html';
// const mainPage = 'sidepanels/main-sp.html';

// browser.runtime.onInstalled.addListener(() => {
//   browser.sidePanel.setOptions({ path: welcomePage });
// });

// browser.tabs.onActivated.addListener(async ({ tabId }) => {
//   const { path } = await browser.sidePanel.getOptions({ tabId });
//   if (path === welcomePage) {
//     browser.sidePanel.setOptions({ path: mainPage });
//   }
// });

