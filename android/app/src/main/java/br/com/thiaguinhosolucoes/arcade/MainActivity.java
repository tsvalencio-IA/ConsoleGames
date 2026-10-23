package br.com.thiaguinhosolucoes.arcade;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

/** The seven existing games run on their original HTTPS origin and keep their saves. */
public final class MainActivity extends Activity {
    public static final String CONSOLE_URL = BuildConfig.CONSOLE_URL;
    private static final int CAMERA_REQUEST = 71;
    WebView webView;
    private ProgressBar progress;
    private LinearLayout errorPanel;
    private PermissionRequest pendingCamera;

    static boolean isConsoleOrigin(Uri uri) {
        return uri != null && "https".equals(uri.getScheme())
                && ("tsvalencio-ia.github.io".equals(uri.getHost())
                    || ("recovery".equals(BuildConfig.FLAVOR) && "otthi-world-campanha-teste.vercel.app".equals(uri.getHost())))
                && (uri.getPort() == -1 || uri.getPort() == 443);
    }
    static boolean isGameUrl(Uri uri) {
        if(!isConsoleOrigin(uri) || uri.getPath()==null)return false;
        if("tsvalencio-ia.github.io".equals(uri.getHost()))return uri.getPath().startsWith("/ConsoleGames/");
        String path=uri.getPath();
        return path.equals("/") || path.startsWith("/arcade/") || path.startsWith("/games/");
    }
    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8,18,38));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8,18,38));
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        progress = new ProgressBar(this);
        FrameLayout.LayoutParams centered = new FrameLayout.LayoutParams(-2,-2,android.view.Gravity.CENTER);
        root.addView(progress, centered);
        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setPadding(32,32,32,32);
        errorPanel.setBackgroundColor(Color.rgb(8,18,38));
        TextView text = new TextView(this);
        text.setText("Confira sua conexão para abrir os jogos.");
        text.setTextColor(Color.WHITE); text.setTextSize(18);
        Button retry = new Button(this); retry.setText("Tentar novamente");
        retry.setOnClickListener(v -> {errorPanel.setVisibility(View.GONE); webView.reload();});
        Button home = new Button(this); home.setText("Voltar ao console");
        home.setOnClickListener(v -> {errorPanel.setVisibility(View.GONE); webView.loadUrl(CONSOLE_URL);});
        errorPanel.addView(text); errorPanel.addView(retry); errorPanel.addView(home);
        root.addView(errorPanel, new FrameLayout.LayoutParams(-1,-2,android.view.Gravity.CENTER));
        errorPanel.setVisibility(View.GONE);
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v,insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.displayCutout() | WindowInsets.Type.systemBars());
                v.setPadding(safe.left,safe.top,safe.right,safe.bottom);
            } else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        CookieManager.getInstance().setAcceptCookie(true);
        webView.setDownloadListener((url,agent,disposition,mime,length) -> {
            Uri uri=Uri.parse(url);
            if(isGameUrl(uri) && uri.getPath().endsWith(".apk")) {
                try {startActivity(new Intent(Intent.ACTION_VIEW,uri));} catch(Exception ignored) { }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if(!request.isForMainFrame()) return false;
                Uri uri=request.getUrl();
                if (isGameUrl(uri)) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
                }
                return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon) {
                errorPanel.setVisibility(View.GONE); progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view,String url) {
                progress.setVisibility(View.GONE); refreshViewport();
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error) {
                if(request.isForMainFrame()) {progress.setVisibility(View.GONE);errorPanel.setVisibility(View.VISIBLE);}
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {runOnUiThread(() -> requestCamera(request));}
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {if(pendingCamera==request)pendingCamera=null;}
        });
        immersive();
        if (savedState==null || webView.restoreState(savedState)==null) webView.loadUrl(CONSOLE_URL);
    }
    private void requestCamera(PermissionRequest request) {
        boolean video=false;
        for(String resource:request.getResources()) if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource))video=true;
        if(!isConsoleOrigin(request.getOrigin()) || !video) {request.deny();return;}
        if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});return;
        }
        if(pendingCamera!=null)pendingCamera.deny();
        pendingCamera=request;
        requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_REQUEST);
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode!=CAMERA_REQUEST || pendingCamera==null)return;
        if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED)
            pendingCamera.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        else pendingCamera.deny();
        pendingCamera=null;
    }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    private void refreshViewport() {
        if(webView==null)return;
        webView.requestLayout();
        webView.evaluateJavascript("window.OTTHI_VIEWPORT?.measure?.();window.dispatchEvent(new Event('resize'));",null);
    }
    @Override public void onConfigurationChanged(Configuration config) {super.onConfigurationChanged(config);immersive();webView.postDelayed(this::refreshViewport,200);}
    @Override public void onWindowFocusChanged(boolean focus) {super.onWindowFocusChanged(focus);if(focus)immersive();}
    @Override protected void onResume() {super.onResume();if(webView!=null){webView.onResume();webView.resumeTimers();refreshViewport();}}
    @Override protected void onPause() {if(webView!=null){webView.onPause();webView.pauseTimers();}super.onPause();}
    @Override public void onBackPressed() {if(webView.canGoBack())webView.goBack();else super.onBackPressed();}
    @Override protected void onSaveInstanceState(Bundle out) {webView.saveState(out);super.onSaveInstanceState(out);}
    @Override protected void onDestroy() {if(pendingCamera!=null){pendingCamera.deny();pendingCamera=null;}if(webView!=null){webView.stopLoading();webView.destroy();webView=null;}super.onDestroy();}
}
