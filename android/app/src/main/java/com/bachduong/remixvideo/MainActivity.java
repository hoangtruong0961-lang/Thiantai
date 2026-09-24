package com.bachduong.remixvideo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HardwareIdPlugin.class);
        registerPlugin(GeminiWebViewPlugin.class);
        registerPlugin(FFmpegKitPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
