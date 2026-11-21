package com.agenteflotante

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.Toast

class MainActivity : Activity() {
    private val reqOverlay = 1
    private val reqMic = 2
    private val reqNotif = 3
    private val reqCapture = 4

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        findViewById<Button>(R.id.btnStart).setOnClickListener { paso() }
    }

    /** Pide los permisos de a uno; cada resultado vuelve a llamar a paso(). */
    private fun paso() {
        if (!Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Permití que CarpiTech se muestre sobre otras apps", Toast.LENGTH_LONG).show()
            startActivityForResult(
                Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")), reqOverlay
            )
            return
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), reqMic)
            return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), reqNotif)
            return
        }
        val mpm = getSystemService(MediaProjectionManager::class.java)
        startActivityForResult(mpm.createScreenCaptureIntent(), reqCapture)
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (code == reqMic && results.firstOrNull() != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "Sin micrófono no puedo escucharte", Toast.LENGTH_LONG).show()
            return
        }
        paso()
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            reqOverlay -> paso()
            reqCapture -> {
                val i = Intent(this, OverlayService::class.java)
                if (resultCode == RESULT_OK && data != null) {
                    i.putExtra("code", resultCode)
                    i.putExtra("data", data)
                } else {
                    Toast.makeText(this, "Seguiré sin ver tu pantalla", Toast.LENGTH_LONG).show()
                }
                startForegroundService(i)
                finish()
            }
        }
    }
}
