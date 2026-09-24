package com.bachduong.remixvideo;

import android.util.Log;
import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.FFmpegKitConfig;
import com.arthenica.ffmpegkit.FFmpegSession;
import com.arthenica.ffmpegkit.ReturnCode;
import com.arthenica.ffmpegkit.SessionState;
import com.arthenica.ffmpegkit.Statistics;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FFmpegKitNative")
public class FFmpegKitPlugin extends Plugin {

    private static final String TAG = "FFmpegKitNative";

    @PluginMethod
    public void getInfo(PluginCall call) {
        try {
            JSObject ret = new JSObject();
            ret.put("isNative", true);
            ret.put("platform", "android");
            ret.put("version", FFmpegKitConfig.getVersion());
            ret.put("buildDate", FFmpegKitConfig.getBuildDate());
            ret.put("packageType", "ffmpeg-kit-full");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get FFmpegKit info", e);
            call.reject("Cannot retrieve FFmpegKit info: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void execute(PluginCall call) {
        String command = call.getString("command");
        if (command == null || command.trim().isEmpty()) {
            call.reject("Command argument cannot be empty");
            return;
        }

        try {
            Log.d(TAG, "Executing FFmpeg command: " + command);

            FFmpegKit.executeAsync(
                command,
                session -> {
                    SessionState state = session.getState();
                    ReturnCode returnCode = session.getReturnCode();

                    JSObject result = new JSObject();
                    result.put("sessionId", session.getSessionId());
                    result.put("state", state != null ? state.name() : "UNKNOWN");
                    result.put("returnCode", returnCode != null ? returnCode.getValue() : -1);
                    result.put("isSuccess", ReturnCode.isSuccess(returnCode));
                    result.put("isCancel", ReturnCode.isCancel(returnCode));
                    result.put("duration", session.getDuration());
                    result.put("output", session.getOutput());

                    if (ReturnCode.isSuccess(returnCode)) {
                        call.resolve(result);
                    } else if (ReturnCode.isCancel(returnCode)) {
                        call.reject("FFmpeg command cancelled", "CANCELLED", result);
                    } else {
                        String failMsg = session.getFailStackTrace();
                        if (failMsg == null || failMsg.isEmpty()) {
                            failMsg = session.getOutput();
                        }
                        call.reject("FFmpeg execution failed with code " + (returnCode != null ? returnCode.getValue() : -1) + ": " + failMsg, "FAILED", result);
                    }
                },
                log -> {
                    JSObject logData = new JSObject();
                    logData.put("sessionId", log.getSessionId());
                    logData.put("level", log.getLevel() != null ? log.getLevel().name() : "INFO");
                    logData.put("message", log.getMessage());
                    notifyListeners("ffmpegLog", logData);
                },
                statistics -> {
                    JSObject statsData = new JSObject();
                    statsData.put("sessionId", statistics.getSessionId());
                    statsData.put("time", statistics.getTime());
                    statsData.put("size", statistics.getSize());
                    statsData.put("bitrate", statistics.getBitrate());
                    statsData.put("speed", statistics.getSpeed());
                    statsData.put("videoFps", statistics.getVideoFps());
                    statsData.put("videoQuality", statistics.getVideoQuality());
                    notifyListeners("ffmpegStatistics", statsData);
                }
            );

        } catch (Exception e) {
            Log.e(TAG, "FFmpegKit execution error", e);
            call.reject("FFmpeg execution exception: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Long sessionId = call.getLong("sessionId");
        try {
            if (sessionId != null && sessionId > 0) {
                FFmpegKit.cancel(sessionId);
            } else {
                FFmpegKit.cancel();
            }
            JSObject res = new JSObject();
            res.put("cancelled", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to cancel FFmpeg session: " + e.getMessage(), e);
        }
    }
}
