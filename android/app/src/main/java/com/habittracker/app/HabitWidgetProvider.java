package com.habittracker.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.widget.RemoteViews;
import android.app.PendingIntent;
import android.app.AlarmManager;

public class HabitWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "HabitTrackerWidget";
    private static final String KEY_HABIT_NAME = "active_habit_name";
    private static final String KEY_IS_TRACKING = "is_tracking";
    private static final String KEY_START_TIME = "start_time_ms";
    private static final String KEY_TARGET_MINUTES = "target_minutes";
    private static final String KEY_DAILY_PROGRESS = "daily_progress";
    private static final String KEY_COMPLETED_HABITS = "completed_habits";
    private static final String KEY_TOTAL_HABITS = "total_habits";
    public static final String ACTION_TICK = "com.habittracker.app.WIDGET_TICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (prefs.getBoolean(KEY_IS_TRACKING, false)) {
            startTickAlarm(context);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_TICK.equals(intent.getAction())) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_IS_TRACKING, false)) {
                updateAllWidgets(context);
                startTickAlarm(context);
            }
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isTracking = prefs.getBoolean(KEY_IS_TRACKING, false);
        String habitName = prefs.getString(KEY_HABIT_NAME, "");
        long startTimeMs = prefs.getLong(KEY_START_TIME, 0);
        int targetMinutes = prefs.getInt(KEY_TARGET_MINUTES, 60);
        int dailyProgress = prefs.getInt(KEY_DAILY_PROGRESS, 0);
        int completedHabits = prefs.getInt(KEY_COMPLETED_HABITS, 0);
        int totalHabits = prefs.getInt(KEY_TOTAL_HABITS, 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit);

        if (isTracking && !habitName.isEmpty() && startTimeMs > 0) {
            // Active tracking mode
            long nowMs = System.currentTimeMillis();
            long elapsedMs = nowMs - startTimeMs;
            long elapsedSec = elapsedMs / 1000;
            long hours = elapsedSec / 3600;
            long minutes = (elapsedSec % 3600) / 60;
            long seconds = elapsedSec % 60;

            String timeStr;
            if (hours > 0) {
                timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds);
            } else {
                timeStr = String.format("%02d:%02d", minutes, seconds);
            }

            float elapsedMinutes = elapsedSec / 60.0f;
            int percentage = Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100));

            views.setTextViewText(R.id.widget_percentage, percentage + "%");
            views.setTextViewText(R.id.widget_habit_name, habitName);
            views.setTextViewText(R.id.widget_timer, timeStr);
            views.setTextViewText(R.id.widget_status, "⏱️");
            views.setViewVisibility(R.id.widget_timer, android.view.View.VISIBLE);
        } else {
            // Idle mode — show daily progress
            String label;
            if (totalHabits > 0) {
                label = completedHabits + "/" + totalHabits + " habits done";
            } else {
                label = "Tap to open";
            }
            views.setTextViewText(R.id.widget_percentage, dailyProgress + "%");
            views.setTextViewText(R.id.widget_habit_name, label);
            views.setTextViewText(R.id.widget_status, dailyProgress >= 100 ? "🔥" : "💤");
            views.setViewVisibility(R.id.widget_timer, android.view.View.GONE);
        }

        // Tap to open app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(
            new android.content.ComponentName(context, HabitWidgetProvider.class)
        );
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    public static void startTickAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent tickIntent = new Intent(context, HabitWidgetProvider.class);
        tickIntent.setAction(ACTION_TICK);
        PendingIntent pi = PendingIntent.getBroadcast(
            context, 1, tickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.set(AlarmManager.RTC, System.currentTimeMillis() + 1000, pi);
    }

    public static void stopTickAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent tickIntent = new Intent(context, HabitWidgetProvider.class);
        tickIntent.setAction(ACTION_TICK);
        PendingIntent pi = PendingIntent.getBroadcast(
            context, 1, tickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(pi);
    }
}
