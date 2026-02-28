# Add project specific ProGuard rules here.
-keepattributes JavascriptInterface
-keepclassmembers class com.krishna.robotcar.MainActivity$BluetoothBridge {
    @android.webkit.JavascriptInterface <methods>;
}
