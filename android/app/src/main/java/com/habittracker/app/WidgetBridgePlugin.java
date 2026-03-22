package com.habittracker.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.SharedPreferences;
import android.content.Context;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    private static final String PREFS_NAME = "HabitTrackerWidget";
    private static final String KEY_HABIT_NAME = "active_habit_name";
    private static final String KEY_IS_TRACKING = "is_tracking";
    private static final String KEY_START_TIME = "start_time_ms";
    private static final String KEY_TARGET_MINUTES = "target_minutes";
    private static final String KEY_DAILY_PROGRESS = "daily_progress";
    private static final String KEY_COMPLETED_HABITS = "completed_habits";
    private static final String KEY_TOTAL_HABITS = "total_habits";

    @PluginMethod
    public void setTrackingState(PluginCall call) {
        boolean isTracking = call.getBoolean("isTracking", false);
        String habitName = call.getString("habitName", "");
        int targetMinutes = call.getInt("targetMinutes", 60);

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(KEY_IS_TRACKING, isTracking);
        editor.putString(KEY_HABIT_NAME, habitName);
        editor.putInt(KEY_TARGET_MINUTES, targetMinutes);

        if (isTracking) {
            editor.putLong(KEY_START_TIME, System.currentTimeMillis());
        } else {
            editor.putLong(KEY_START_TIME, 0);
        }
        editor.apply();

        HabitWidgetProvider.updateAllWidgets(context);

        if (isTracking) {
            HabitWidgetProvider.startTickAlarm(context);
        } else {
            HabitWidgetProvider.stopTickAlarm(context);
        }

        call.resolve();
    }

    @PluginMethod
    public void setDailyProgress(PluginCall call) {
        int progress = call.getInt("progress", 0);
        int completedHabits = call.getInt("completedHabits", 0);
        int totalHabits = call.getInt("totalHabits", 0);

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putInt(KEY_DAILY_PROGRESS, progress);
        editor.putInt(KEY_COMPLETED_HABITS, completedHabits);
        editor.putInt(KEY_TOTAL_HABITS, totalHabits);
        editor.apply();

        HabitWidgetProvider.updateAllWidgets(context);
        call.resolve();
    }

    @PluginMethod
    public void getTrackingState(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        JSObject result = new JSObject();
        result.put("isTracking", prefs.getBoolean(KEY_IS_TRACKING, false));
        result.put("habitName", prefs.getString(KEY_HABIT_NAME, ""));
        result.put("targetMinutes", prefs.getInt(KEY_TARGET_MINUTES, 60));
        result.put("startTimeMs", prefs.getLong(KEY_START_TIME, 0));
        result.put("dailyProgress", prefs.getInt(KEY_DAILY_PROGRESS, 0));
        call.resolve(result);
    }
}
