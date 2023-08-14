let url = 'www.baidu.com';
let borderValue;

chrome.runtime.onConnect.addListener(res => {
  if (res.name == "popup") {
    res.onMessage.addListener(mes => {
	  url = mes[0];
	  console.log('🥓: popup.js receive', url);
      res.postMessage('📣: popup.js receiveBack')
    });
	document.addEventListener('mouseover',showBorder);
	document.addEventListener('mouseout',hiddenBorder);
	document.addEventListener('click',replaceDom);
  }
});

function showBorder(el){
	borderValue = el.target.style.border;
	el.target.style.border = "1px solid #111";
}

function hiddenBorder(el) {
	el.target.style.border = borderValue;
}

function replaceDom(el) {
	let width = el.target.offsetWidth;
	let height = el.target.clientHeight;
	el.target.innerHTML = `<iframe src="${url}" style = "width: ${width}px;  height: ${height}px"></iframe>`;
	removeListener();
}

function removeListener() {
	document.removeEventListener('mouseover', showBorder);
	document.removeEventListener('mouseout', hiddenBorder);
	document.removeEventListener('click', replaceDom);
}