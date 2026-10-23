package br.com.thiaguinhosolucoes.arcade;

import android.app.Instrumentation;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.graphics.Bitmap;
import android.view.accessibility.AccessibilityNodeInfo;
import android.os.SystemClock;
import org.json.JSONArray;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Real Android WebView, without signing into any account or changing game progress. */
public final class ArcadeSmoke extends Instrumentation {
    private volatile MainActivity currentActivity;
    private String lastTouch="none";
    private String checkpoint="launch";
    private void nativeTap(float x,float y) throws Exception {
        // Android's own input command builds the complete pointer stream,
        // including device metadata, down/up and cancellation semantics.
        String command="input touchscreen swipe "+Math.round(x)+" "+Math.round(y)+" "+Math.round(x)+" "+Math.round(y)+" 180";
        try(android.os.ParcelFileDescriptor descriptor=getUiAutomation().executeShellCommand(command);
            java.io.FileInputStream output=new java.io.FileInputStream(descriptor.getFileDescriptor())) {
            byte[] buffer=new byte[256];while(output.read(buffer)!=-1){}
        }
    }
    private void report(String message) {Bundle status=new Bundle();status.putString("stream",message+"\n");sendStatus(0,status);}
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
        throw new AssertionError("Android flow failed: "+expression+" URL="+evaluate(activity,"location.href")+" lastTouch="+lastTouch+" events="+evaluate(activity,"JSON.stringify(window.__androidTouches||[])"));
    }
    private void waitForAppWindow() throws Exception {
        long deadline=System.currentTimeMillis()+15000;
        while(System.currentTimeMillis()<deadline){
            AccessibilityNodeInfo root=getUiAutomation().getRootInActiveWindow();
            if(root!=null && root.getPackageName()!=null && getTargetContext().getPackageName().contentEquals(root.getPackageName()))return;
            Thread.sleep(300);
        }
        throw new AssertionError("A system window is covering the console");
    }
    private void openLibrary(MainActivity activity) throws Exception {
        // Locate the real button in CSS pixels, then tap through Android input.
        // This also works when the system WebView omits HTML text from its AX tree.
        String json=evaluate(activity,"(()=>{const b=document.getElementById('browse-btn');b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return [innerWidth,r.left+r.width/2,r.top+r.height/2];})()");
        JSONArray css=new JSONArray(json);float[] point=new float[2];
        runOnMainSync(() -> {
            int[] origin=new int[2];currentActivity.webView.getLocationOnScreen(origin);
            float scale=currentActivity.webView.getWidth()/(float)css.optDouble(0);
            point[0]=origin[0]+(float)css.optDouble(1)*scale;
            point[1]=origin[1]+(float)css.optDouble(2)*scale;
        });
        waitForIdleSync();Thread.sleep(500);
        nativeTap(point[0],point[1]);
    }
    private void screenshot(String name) throws Exception {
        Bitmap image=getUiAutomation().takeScreenshot();
        File folder=getTargetContext().getExternalFilesDir(null);
        try(FileOutputStream out=new FileOutputStream(new File(folder,name))){image.compress(Bitmap.CompressFormat.PNG,100,out);}
        image.recycle();
    }
    private void tap(MainActivity activity,String selector) throws Exception {
        checkpoint="tap "+selector;
        String escaped=org.json.JSONObject.quote(selector);
        waitFor(activity,"!!document.querySelector("+escaped+")");
        String json=evaluate(activity,"(()=>{const b=document.querySelector("+escaped+");b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return [innerWidth,r.left+r.width/2,r.top+r.height/2,visualViewport?.offsetLeft||0,visualViewport?.offsetTop||0,devicePixelRatio,visualViewport?.scale||1];})()");
        // CSS scrolling/layout can finish before Android has presented that
        // frame. Wait for the real WebView compositor, then measure again.
        CountDownLatch painted=new CountDownLatch(1);
        runOnMainSync(() -> currentActivity.webView.postVisualStateCallback(SystemClock.uptimeMillis(),new android.webkit.WebView.VisualStateCallback(){@Override public void onComplete(long requestId){painted.countDown();}}));
        if(!painted.await(10,TimeUnit.SECONDS))throw new AssertionError("WebView did not present the touch target: "+selector);
        waitForIdleSync();Thread.sleep(200);
        json=evaluate(activity,"(()=>{const b=document.querySelector("+escaped+");const r=b.getBoundingClientRect();return [innerWidth,r.left+r.width/2,r.top+r.height/2,visualViewport?.offsetLeft||0,visualViewport?.offsetTop||0,devicePixelRatio,visualViewport?.scale||1];})()");
        evaluate(activity,"(()=>{window.__androidTouches=[];if(!window.__androidTouchObserver){window.__androidTouchObserver=true;for(const n of ['pointerdown','pointerup','pointercancel','click'])document.addEventListener(n,e=>{window.__androidTouches.push({type:n,pointer:e.pointerType,id:e.target.id,tag:e.target.tagName,launch:e.target.closest('[data-launch]')?.dataset.launch,x:e.clientX,y:e.clientY});window.__androidTouches=window.__androidTouches.slice(-8)},true)}})()");
        JSONArray css=new JSONArray(json);float[] point=new float[2];
        runOnMainSync(() -> {int[] origin=new int[2];currentActivity.webView.getLocationOnScreen(origin);float scale=currentActivity.webView.getScale();point[0]=origin[0]+(float)(css.optDouble(1)-css.optDouble(3))*scale;point[1]=origin[1]+(float)(css.optDouble(2)-css.optDouble(4))*scale;lastTouch=selector+" css="+css+" scale="+scale+" native="+point[0]+","+point[1];});
        nativeTap(point[0],point[1]);
        Thread.sleep(200);Bundle debug=new Bundle();debug.putString("stream","Android native touch "+lastTouch+": "+evaluate(activity,"JSON.stringify(window.__androidTouches||[])")+"\n");sendStatus(0,debug);
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
            waitForAppWindow();openLibrary(activity);waitFor(activity,"document.getElementById('biblioteca').getBoundingClientRect().top<180 && scrollY>100");
            waitForIdleSync();Thread.sleep(800);
            screenshot("android-portrait.png");
            runOnMainSync(() -> currentActivity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            waitFor(activity,"innerWidth>innerHeight && document.querySelectorAll('#games-grid [data-game]').length===7");
            waitFor(activity,"document.documentElement.scrollWidth<=innerWidth+2");
            waitForAppWindow();waitForIdleSync();Thread.sleep(800);
            screenshot("android-landscape.png");
            String[][] games={{"kart","drive"},{"boxe","box_pro"},{"tenis","tennis"},{"ar","ar_truck_sim"},{"voo","usarmy_flight_sim"}};
            for(String[] game:games){
                tap(activity,"[data-game='"+game[0]+"'] [data-launch]");
                waitFor(activity,"!!document.querySelector('[data-solo-start]')");tap(activity,"[data-solo-start]");
                waitFor(activity,"!document.getElementById('phase-screen').classList.contains('hidden')");
                tap(activity,"#phase-grid .mission-card:not(.locked)");tap(activity,"[data-mode='controls']");
                checkpoint="start "+game[0];
                waitFor(activity,"window.System?.activeGame?.id==='"+game[1]+"' && !document.getElementById('game-ui').classList.contains('hidden')");
                report("Android started "+game[0]+" "+evaluate(activity,"JSON.stringify({state:window.System.activeGame?.logic.state,audio:window.GameAudio?.diagnostics(),width:innerWidth,scroll:document.documentElement.scrollWidth})"));
                if("ar".equals(game[0])){
                    // Fire before slow emulator inspection lets an unattended
                    // mission finish. Do not alter enemies, damage or timing.
                    tap(activity,"[data-control='fire']");
                    waitFor(activity,"window.System.activeGame?.logic.stats.shots>0");
                }
                checkpoint="audio/layout "+game[0];
                waitFor(activity,"window.GameAudio?.diagnostics().state==='running' && document.documentElement.scrollWidth<=innerWidth+2");
                screenshot("android-native-"+game[0]+".png");
                tap(activity,"#arcade-pause");tap(activity,"#arcade-pause-modal [data-action='exit']");
                waitFor(activity,"document.querySelectorAll('#games-grid [data-game]').length===7");
            }
            result.putString("stream","Android: installed, seven games, original five engines entered with native touch, running audio contexts, WAR firing, console return, portrait/landscape, HTTPS navigation, no unsolicited camera request.\n");
            finish(-1,result);
        } catch(Throwable error) {try{screenshot("android-failure.png");report("Android failure at "+checkpoint+" "+evaluate(currentActivity,"JSON.stringify({url:location.href,state:window.System?.activeGame?.logic.state,audio:window.GameAudio?.diagnostics(),lastEvents:window.__androidTouches})"));}catch(Exception ignored){}result.putString("stream",checkpoint+": "+android.util.Log.getStackTraceString(error)+"\n");finish(0,result);}
    }
}
