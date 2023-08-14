const targetUrl = document.getElementById('targetUrl');
const focusModeButton = document.getElementById('focusModeButton');
const msg = document.getElementById("message");

focusModeButton.onclick = function (e) {
	showMsg("正在开启");
	sendNotice(targetUrl.value);
}

function showMsg(msg) {
	msg.textContent = msg;
}

async function sendNotice(...arg) {
  const tabId = await getCurrentTabId();
  const connect = chrome.tabs.connect(tabId, { name: 'popup' });
  // 发送信息
  connect.postMessage(arg);
 
  // 接受返回信息
  connect.onMessage.addListener(mess => {
    console.log(mess);
  })
};


function getCurrentTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resolve(tabs.length ? tabs[0].id : null)
    });
  })
};
