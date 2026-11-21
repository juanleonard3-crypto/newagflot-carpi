package com.agenteflotante

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageView
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayOutputStream
import kotlin.math.abs
import kotlin.math.min

class OverlayService : Service() {
    private lateinit var wm: WindowManager
    private var bubble: ImageView? = null
    private var web: WebView? = null
    private var panelShown = false
    private lateinit var bubbleLp: WindowManager.LayoutParams
    private lateinit var panelLp: WindowManager.LayoutParams

    private var projection: MediaProjection? = null
    private var reader: ImageReader? = null
    private var display: VirtualDisplay? = null
    private var lastJpeg: String? = null
    private var capW = 0
    private var capH = 0
    private val main = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel("agente", "Agente flotante", NotificationManager.IMPORTANCE_LOW))
        val notif = Notification.Builder(this, "agente")
            .setContentTitle("CarpiTech está activo")
            .setContentText("Tocá la burbuja para conversar")
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()

        val code = intent?.getIntExtra("code", 0) ?: 0
        @Suppress("DEPRECATION")
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33)
            intent?.getParcelableExtra("data", Intent::class.java) else intent?.getParcelableExtra("data")
        val conPantalla = code == Activity.RESULT_OK && data != null

        var tipo = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        if (conPantalla) tipo = tipo or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
        startForeground(1, notif, tipo)

        if (conPantalla && projection == null) prepararCaptura(code, data!!)
        if (bubble == null) construirInterfaz()
        return START_NOT_STICKY
    }

    private fun prepararCaptura(code: Int, data: Intent) {
        val mpm = getSystemService(MediaProjectionManager::class.java)
        val p = mpm.getMediaProjection(code, data)
        p.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() { liberarCaptura() }
        }, main)
        val m = resources.displayMetrics
        capW = m.widthPixels
        capH = m.heightPixels
        reader = ImageReader.newInstance(capW, capH, PixelFormat.RGBA_8888, 2)
        display = p.createVirtualDisplay(
            "captura", capW, capH, m.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader!!.surface, null, null
        )
        projection = p
    }

    private fun liberarCaptura() {
        display?.release(); display = null
        reader?.close(); reader = null
        projection = null
    }

    /** Captura la pantalla y devuelve un JPEG en base64. Se oculta la burbuja y el panel un instante. */
    private fun capturar(): String {
        val r = reader ?: return ""
        main.post { web?.visibility = View.INVISIBLE; bubble?.visibility = View.INVISIBLE }
        try {
            Thread.sleep(350)
            val limite = if (lastJpeg == null) 2000L else 500L
            val t0 = System.currentTimeMillis()
            var img = r.acquireLatestImage()
            while (img == null && System.currentTimeMillis() - t0 < limite) {
                Thread.sleep(60)
                img = r.acquireLatestImage()
            }
            if (img != null) {
                val p = img.planes[0]
                val pad = p.rowStride - p.pixelStride * img.width
                val full = Bitmap.createBitmap(img.width + pad / p.pixelStride, img.height, Bitmap.Config.ARGB_8888)
                full.copyPixelsFromBuffer(p.buffer)
                val w = img.width
                val h = img.height
                img.close()
                val crop = Bitmap.createBitmap(full, 0, 0, w, h)
                val k = min(1f, 1280f / maxOf(w, h))
                val esc = Bitmap.createScaledBitmap(crop, (w * k).toInt(), (h * k).toInt(), true)
                val out = ByteArrayOutputStream()
                esc.compress(Bitmap.CompressFormat.JPEG, 70, out)
                lastJpeg = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
            }
        } catch (e: Exception) {
            // si falla, se usa la última captura buena
        } finally {
            main.post { web?.visibility = View.VISIBLE; bubble?.visibility = View.VISIBLE }
        }
        return lastJpeg ?: ""
    }

    inner class Puente {
        @JavascriptInterface fun captureScreen(): String = capturar()
        @JavascriptInterface fun hasScreen(): Boolean = projection != null
    }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun construirInterfaz() {
        wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val ctx = ContextThemeWrapper(this, R.style.AppTheme)
        val m = resources.displayMetrics

        // Panel con la interfaz web
        val w = WebView(ctx)
        w.settings.javaScriptEnabled = true
        w.settings.domStorageEnabled = true
        w.settings.mediaPlaybackRequiresUserGesture = false
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        w.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)
        }
        w.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) { request.grant(request.resources) }
        }
        w.addJavascriptInterface(Puente(), "AndroidBridge")
        w.loadUrl("https://appassets.androidplatform.net/assets/ui/index.html")
        web = w
        panelLp = WindowManager.LayoutParams(
            min((m.widthPixels * 0.94).toInt(), dp(400)), (m.heightPixels * 0.72).toInt(),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL, PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = dp(12)
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }

        // Burbuja arrastrable
        val b = ImageView(ctx)
        b.setImageResource(R.drawable.mascota)
        b.setBackgroundResource(android.R.drawable.dialog_holo_light_frame)
        b.setPadding(dp(4), dp(4), dp(4), dp(4))
        bubbleLp = WindowManager.LayoutParams(
            dp(68), dp(68), WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT
        ).apply { gravity = Gravity.TOP or Gravity.START; x = dp(10); y = dp(220) }
        var downX = 0f; var downY = 0f; var startX = 0; var startY = 0; var moved = false
        b.setOnTouchListener { _, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> { downX = e.rawX; downY = e.rawY; startX = bubbleLp.x; startY = bubbleLp.y; moved = false }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - downX; val dy = e.rawY - downY
                    if (abs(dx) + abs(dy) > dp(6)) moved = true
                    if (moved) { bubbleLp.x = startX + dx.toInt(); bubbleLp.y = startY + dy.toInt(); wm.updateViewLayout(b, bubbleLp) }
                }
                MotionEvent.ACTION_UP -> if (!moved) alternarPanel()
            }
            true
        }
        bubble = b
        wm.addView(b, bubbleLp)
    }

    private fun alternarPanel() {
        val w = web ?: return
        val b = bubble ?: return
        if (panelShown) {
            wm.removeView(w)
        } else {
            wm.addView(w, panelLp)
            // La burbuja se vuelve a poner arriba del panel
            wm.removeView(b)
            wm.addView(b, bubbleLp)
        }
        panelShown = !panelShown
    }

    override fun onDestroy() {
        try { if (panelShown) web?.let { wm.removeView(it) } } catch (_: Exception) {}
        try { bubble?.let { wm.removeView(it) } } catch (_: Exception) {}
        web?.destroy()
        liberarCaptura()
        super.onDestroy()
    }
}
