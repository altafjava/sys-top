const si = require('systeminformation');
const { ipcRenderer } = require('electron');
const path = require('path');
const osu = require('node-os-utils');
const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;

let cpuOverload;
let alertFrequency;

ipcRenderer.on('settings:get', (e, settings) => {
  cpuOverload = +settings.cpuOverload;
  alertFrequency = +settings.alertFrequency;
});
// Run every 2 second
setInterval(() => {
  cpu.usage().then((info) => {
    document.getElementById('cpu-usage').innerText = info + '%';
    document.getElementById('cpu-progress').style.width = info + '%';
    if (info >= cpuOverload) {
      document.getElementById('cpu-progress').style.background = 'red';
    } else {
      document.getElementById('cpu-progress').style.background = '#30c88b';
    }
    if (info >= cpuOverload && runNotify(alertFrequency)) {
      notifyUser({
        title: 'CPU Overload',
        body: `CPU is over ${cpuOverload}`,
        icon: path.join(__dirname, 'img', 'icon.png'),
      });
      localStorage.setItem('lastNotify', +new Date());
    }
  });
  cpu.free().then((info) => {
    document.getElementById('cpu-free').innerText = Math.round(info * 100) / 100 + '%';
  });
  document.getElementById('sys-uptime').innerText = secondsToDhms(os.uptime());
}, 2000);
document.getElementById('cpu-model').innerText = cpu.model();

si.osInfo().then((osInfo) => {
  document.getElementById('comp-name').innerText = osInfo.hostname;
  document.getElementById('os').innerText = osInfo.distro;
  document.getElementById('version').innerText = osInfo.release;
  document.getElementById('architecture').innerText = osInfo.arch;
  document.getElementById('platform').innerText = osInfo.platform;
});
mem.info().then((info) => {
  document.getElementById('mem-total').innerText = info.totalMemMb + 'GB';
});

function secondsToDhms(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.round(((Math.floor(seconds % (3600 * 24)) / 3600) * 100) / 100);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d, ${h}h, ${m}m, ${s}s`;
}

function notifyUser(options) {
  new Notification(options.title, options);
}

function runNotify(frequency) {
  if (localStorage.getItem('lastNotify') === null) {
    localStorage.setItem('lastNotify', +new Date());
    return true;
  }
  const notifyTime = new Date(parseInt(localStorage.getItem('lastNotify')));
  const now = new Date();
  const diff = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diff / (1000 * 60));
  return minutesPassed > frequency ? true : false;
}
