package br.com.thiaguinhosolucoes.arcade;

import android.app.Instrumentation;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.graphics.Bitmap;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Real Android WebView, without signing into any account or changing game progress. */
public final class ArcadeSmoke extends Instrumentation {
    private volatile MainActivity currentActivity;
    @Override public void callActivityOnResume(Activity activity) {
        super.callActivityOnResume(activity);
        if(activity instanceof MainActivity)currentActivity=(MainActivity)activity;
    }
    @Override public void onCreate(Bundle args) {super.onCreate(args);start();}
    private String evaluate(MainActivity activity,String expression) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();
        runOnMainSync(() -> {
            MainActivity active=currentActivity;
            if(active==null || active.webView==null){value.set("null");latch.countDown();return;}
            active.webView.evaluateJavascript(expression,result -> {value.set(result);latch.countDown();});
        });
        if(!latch.await(15,TimeUnit.SECONDS))return "null";
        return value.get();
    }
    private void waitFor(MainActivity activity,String expression) throws Exception {
        long deadline=System.currentTimeMillis()+60000;
        while(System.currentTimeMillis()<deadline){if("true".equals(evaluate(activity,expression)))return;Thread.sleep(400);}
        throw new AssertionError("Android flow failed: "+expression+" URL="+evaluate(activity,"location.href"));
    }
    private void screenshot(String name) throws Exception {
        Bitmap image=getUiAutomation().takeScreenshot();
        File folder=getTargetContext().getExternalFilesDir(null);
        try(FileOutputStream out=new FileOutputStream(new File(folder,name))){image.compress(Bitmap.CompressFormat.PNG,100,out);}
        image.recycle();
    }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            if(!MainActivity.isGameUrl(Uri.parse(MainActivity.CONSOLE_URL)))throw new AssertionError("Wrong app destination");
            if(MainActivity.isGameUrl(Uri.parse("https://tsvalencio-ia.github.io.evil.test/ConsoleGames/")))throw new AssertionError("Untrusted navigation");
            Intent intent=new Intent(getTargetContext(),MainActivity.class);intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            MainActivity activity=(MainActivity)startActivitySync(intent);
            waitFor(activity,"document.querySelectorAll('#games-grid [data-game]').length===7");
            if(getTargetContext().checkSelfPermission(android.Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)throw new AssertionError("Camera requested before choosing camera mode");
            waitFor(activity,"document.documentElement.scrollWidth<=innerWidth+2");
            screenshot("android-portrait.png");
            runOnMainSync(() -> currentActivity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            waitFor(activity,"innerWidth>innerHeight && document.querySelectorAll('#games-grid [data-game]').length===7");
            waitFor(activity,"document.documentElement.scrollWidth<=innerWidth+2");
            screenshot("android-landscape.png");
            result.putString("stream","Android: installed, seven games, portrait/landscape, HTTPS navigation, no unsolicited camera request.\n");
            finish(-1,result);
        } catch(Throwable error) {try{screenshot("android-failure.png");}catch(Exception ignored){}result.putString("stream",error.toString()+"\n");finish(0,result);}
    }
}
