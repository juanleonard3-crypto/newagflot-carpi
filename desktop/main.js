const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, screen, session } = require('electron');
const path = require('path');
const fs = require('fs');

const SIZES = { collapsed: { w: 84, h: 84 }, expanded: { w: 380, h: 620 } };
let win;

function uiPath() {
  const empaquetado = path.join(__dirname, 'ui', 'index.html');
  return fs.existsSync(empaquetado) ? empaquetado : path.join(__dirname, '..', 'shared-ui', 'index.html');
}

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(() => {
  const permitido = ['media', 'audioCapture', 'microphone'];
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(permitido.includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => permitido.includes(perm));

  const wa = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: SIZES.expanded.w, height: SIZES.expanded.h,
    x: wa.x + wa.width - SIZES.expanded.w - 20, y: wa.y + wa.height - SIZES.expanded.h - 20,
    frame: false, transparent: true, resizable: false, hasShadow: false,
    alwaysOnTop: true, title: 'CarpiTech',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setContentProtection(true); // la ventana no aparece en su propia captura
  win.loadFile(uiPath());

  // Atajo para mostrar u ocultar
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (win.isVisible()) win.hide(); else { win.show(); win.focus(); }
  });
});

ipcMain.handle('capture', async () => {
  const d = screen.getPrimaryDisplay();
  const fuentes = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.min(1600, d.size.width), height: Math.min(1000, d.size.height) },
  });
  if (!fuentes.length) return '';
  return fuentes[0].thumbnail.toJPEG(70).toString('base64');
});

ipcMain.on('expand', (e, expandido) => {
  const b = win.getBounds();
  const s = expandido ? SIZES.expanded : SIZES.collapsed;
  win.setResizable(true);
  win.setBounds({ x: b.x + b.width - s.w, y: b.y + b.height - s.h, width: s.w, height: s.h });
  win.setResizable(false);
});

ipcMain.on('move', (e, dx, dy) => {
  const [x, y] = win.getPosition();
  win.setPosition(Math.round(x + dx), Math.round(y + dy));
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
