package com.krishna.robotcar;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

public class MainActivity extends Activity {

    private WebView webView;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket btSocket;
    private OutputStream outputStream;
    private volatile boolean isConnected = false;

    // Standard SPP UUID for HC-05
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final int REQUEST_BT_PERMISSIONS = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Remove title bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Make status bar and nav bar transparent
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.parseColor("#0a0e17"));

        // Enable immersive sticky mode - bars hide automatically
        // and only appear temporarily when user swipes from edge
        enableImmersiveMode();

        // Re-enable immersive mode when system UI becomes visible
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                // System bars are visible, re-hide after a moment
                getWindow().getDecorView().postDelayed(() -> enableImmersiveMode(), 2000);
            }
        });

        // Request Bluetooth permissions
        requestBluetoothPermissions();

        // Initialize Bluetooth
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        // Setup WebView
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.setBackgroundColor(Color.parseColor("#0a0e17"));

        // Add Bluetooth JavaScript Interface
        webView.addJavascriptInterface(new BluetoothBridge(), "BluetoothBridge");

        // Load the app
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void enableImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    private void requestBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED ||
                    ContextCompat.checkSelfPermission(this,
                            Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[] {
                                Manifest.permission.BLUETOOTH_CONNECT,
                                Manifest.permission.BLUETOOTH_SCAN
                        }, REQUEST_BT_PERMISSIONS);
            }
        } else {
            // Below Android 12
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[] {
                                Manifest.permission.BLUETOOTH,
                                Manifest.permission.BLUETOOTH_ADMIN,
                                Manifest.permission.ACCESS_FINE_LOCATION
                        }, REQUEST_BT_PERMISSIONS);
            }
        }
    }

    /**
     * JavaScript Interface that the web app calls for Bluetooth operations.
     * Exposed as window.BluetoothBridge in JavaScript.
     */
    public class BluetoothBridge {

        @JavascriptInterface
        public String getPairedDevices() {
            JSONArray devices = new JSONArray();
            try {
                if (bluetoothAdapter == null)
                    return devices.toString();

                Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
                if (pairedDevices != null) {
                    for (BluetoothDevice device : pairedDevices) {
                        JSONObject obj = new JSONObject();
                        obj.put("name", device.getName() != null ? device.getName() : "Unknown");
                        obj.put("address", device.getAddress());
                        devices.put(obj);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return devices.toString();
        }

        @JavascriptInterface
        public void connect(final String address) {
            new Thread(() -> {
                try {
                    if (bluetoothAdapter == null) {
                        callJS("onBluetoothError", "Bluetooth not available");
                        return;
                    }

                    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
                    btSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    bluetoothAdapter.cancelDiscovery();
                    btSocket.connect();
                    outputStream = btSocket.getOutputStream();
                    isConnected = true;

                    String name = device.getName() != null ? device.getName() : address;
                    callJS("onBluetoothConnected", name);

                } catch (Exception e) {
                    isConnected = false;
                    callJS("onBluetoothError", e.getMessage());
                }
            }).start();
        }

        @JavascriptInterface
        public void disconnect() {
            try {
                if (outputStream != null)
                    outputStream.close();
                if (btSocket != null)
                    btSocket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            isConnected = false;
            outputStream = null;
            btSocket = null;
        }

        @JavascriptInterface
        public void send(String data) {
            if (outputStream != null && isConnected) {
                try {
                    // Verify socket is still alive
                    if (btSocket == null || !btSocket.isConnected()) {
                        isConnected = false;
                        callJS("onBluetoothDisconnected", "");
                        return;
                    }
                    outputStream.write(data.getBytes());
                    outputStream.flush();
                } catch (IOException e) {
                    isConnected = false;
                    callJS("onBluetoothDisconnected", "");
                }
            }
        }

        @JavascriptInterface
        public boolean isConnected() {
            return isConnected;
        }

        @JavascriptInterface
        public void setScreenOrientation(final String orientation) {
            runOnUiThread(() -> {
                switch (orientation) {
                    case "landscape":
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        break;
                    case "portrait":
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
                        break;
                    default:
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        break;
                }
            });
        }
    }

    private void callJS(final String functionName, final String param) {
        runOnUiThread(() -> {
            String js = "javascript:" + functionName + "('" + param.replace("'", "\\'") + "')";
            webView.evaluateJavascript(js, null);
        });
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (btSocket != null) {
            try {
                btSocket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
