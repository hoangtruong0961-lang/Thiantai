package com.bachduong.remixvideo;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "Uncaught exception intercepted safely: " + throwable.getMessage(), throwable);
        });

        registerPlugin(HardwareIdPlugin.class);
        registerPlugin(GeminiWebViewPlugin.class);
        registerPlugin(FFmpegKitPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
