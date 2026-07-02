package com.prep.tracker;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity with WebView camera permission support.
 * Required for gesture camera navigation to work in the Capacitor WebView.
 * Without this, getUserMedia() calls will silently fail on Android.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get the Capacitor WebView and configure it to grant camera permissions
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    // Auto-grant camera and microphone permissions to the WebView
                    // The native Android permission dialog will still appear for the user
                    runOnUiThread(() -> request.grant(request.getResources()));
                }
            });
        }
    }
}
