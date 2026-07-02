package com.prep.tracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SweepGradient;
import android.graphics.BlurMaskFilter;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;

public class DailyGoalWidget extends AppWidgetProvider {

    private static final String ACTION_PLAY_PAUSE = "com.prep.tracker.ACTION_PLAY_PAUSE";
    private static final String ACTION_STOP = "com.prep.tracker.ACTION_STOP";
    private static final String ACTION_COMPLETE = "com.prep.tracker.ACTION_COMPLETE";
    private static final String ACTION_PLAY_TASK = "com.prep.tracker.ACTION_PLAY_TASK";

    private static final String EXTRA_TASK_INDEX = "com.prep.tracker.EXTRA_TASK_INDEX";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.daily_goal_widget);
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);

        // 1. Calculate Midnight Reset Timer base
        Calendar midnight = Calendar.getInstance();
        midnight.set(Calendar.HOUR_OF_DAY, 24);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 0);
        midnight.set(Calendar.MILLISECOND, 0);
        long timeToMidnightMs = midnight.getTimeInMillis() - System.currentTimeMillis();
        long baseTime = SystemClock.elapsedRealtime() + timeToMidnightMs;

        // RemoteViews setChronometer handles starting the ticking chronometer natively.
        views.setChronometer(R.id.widget_reset_countdown, baseTime, "%tH:%tM:%tS", true);
        
        // Use generic setBoolean reflectively to set the countdown property on the Chronometer view (N+).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            views.setBoolean(R.id.widget_reset_countdown, "setCountDown", true);
        }

        // 2. Read Progress State safely as String
        int percentage = 0;
        try {
            Object percentageObj = prefs.getAll().get("goal_completion_percentage");
            percentage = percentageObj != null ? Integer.parseInt(String.valueOf(percentageObj)) : 0;
        } catch (Exception e) {}
        views.setTextViewText(R.id.widget_percentage_text, percentage + "%");

        // 3. Render Neon Circular Progress Ring
        Bitmap progressBmp = drawProgressRing(context, percentage);
        if (progressBmp != null) {
            views.setImageViewBitmap(R.id.widget_progress_ring, progressBmp);
        }

        // 4. Handle Layout state (Active Task Timer vs Task List)
        String activeTaskId = prefs.getString("active_task_id", null);
        
        if (activeTaskId != null && !activeTaskId.trim().isEmpty()) {
            // Task is actively running
            views.setViewVisibility(R.id.widget_tasks_list_layout, View.GONE);
            views.setViewVisibility(R.id.widget_active_task_dock, View.VISIBLE);

            String activeTaskTitle = prefs.getString("active_task_title", "Active Task");
            views.setTextViewText(R.id.widget_active_task_title, activeTaskTitle);

            long elapsed = 0;
            long startTime = 0;
            boolean isPaused = true;
            try {
                Object elapsedObj = prefs.getAll().get("active_task_elapsed");
                Object startTimeObj = prefs.getAll().get("active_task_start_time");
                Object isPausedObj = prefs.getAll().get("active_task_is_paused");

                elapsed = elapsedObj != null ? Long.parseLong(String.valueOf(elapsedObj)) : 0;
                startTime = startTimeObj != null ? Long.parseLong(String.valueOf(startTimeObj)) : 0;
                isPaused = isPausedObj != null ? "true".equals(String.valueOf(isPausedObj)) : true;
            } catch (Exception e) {}

            long chronometerBase;
            if (isPaused) {
                chronometerBase = SystemClock.elapsedRealtime() - (elapsed * 1000);
                // When paused, we stop active updates and show a static text representation.
                views.setChronometer(R.id.widget_active_task_status, chronometerBase, "Paused: " + formatDuration(elapsed), false);
            } else {
                long wallSeconds = (System.currentTimeMillis() - startTime) / 1000;
                chronometerBase = SystemClock.elapsedRealtime() - ((elapsed + wallSeconds) * 1000);
                // Passing true in setChronometer automatically starts the clock updates
                views.setChronometer(R.id.widget_active_task_status, chronometerBase, "Active: %tM:%tS", true);
            }

            // Set up Active Task dock buttons PendingIntents
            views.setOnClickPendingIntent(R.id.widget_btn_play_pause, getPendingSelfIntent(context, ACTION_PLAY_PAUSE, 101));
            views.setOnClickPendingIntent(R.id.widget_btn_stop, getPendingSelfIntent(context, ACTION_STOP, 102));
            views.setOnClickPendingIntent(R.id.widget_btn_complete, getPendingSelfIntent(context, ACTION_COMPLETE, 103));

            // Set correct icon for play/pause
            views.setImageViewResource(R.id.widget_btn_play_pause, 
                isPaused ? R.drawable.ic_widget_play : R.drawable.ic_widget_pause);

        } else {
            // No active task running: Display list of goals
            views.setViewVisibility(R.id.widget_active_task_dock, View.GONE);
            views.setViewVisibility(R.id.widget_tasks_list_layout, View.VISIBLE);

            int taskCount = 0;
            try {
                Object taskCountObj = prefs.getAll().get("task_count");
                taskCount = taskCountObj != null ? Integer.parseInt(String.valueOf(taskCountObj)) : 0;
            } catch (Exception e) {}
            if (taskCount == 0) {
                views.setViewVisibility(R.id.widget_empty_tasks_text, View.VISIBLE);
                views.setViewVisibility(R.id.widget_task_row_1, View.GONE);
                views.setViewVisibility(R.id.widget_task_row_2, View.GONE);
                views.setViewVisibility(R.id.widget_task_row_3, View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_empty_tasks_text, View.GONE);
                
                // Bind Task Row 1
                if (taskCount >= 1) {
                    views.setViewVisibility(R.id.widget_task_row_1, View.VISIBLE);
                    views.setTextViewText(R.id.widget_task_row_1_title, prefs.getString("task_1_title", ""));
                    views.setTextViewText(R.id.widget_task_row_1_target, prefs.getString("task_1_target", "") + "h");
                    views.setOnClickPendingIntent(R.id.widget_task_row_1_play, getPlayTaskPendingIntent(context, 1));
                } else {
                    views.setViewVisibility(R.id.widget_task_row_1, View.GONE);
                }

                // Bind Task Row 2
                if (taskCount >= 2) {
                    views.setViewVisibility(R.id.widget_task_row_2, View.VISIBLE);
                    views.setTextViewText(R.id.widget_task_row_2_title, prefs.getString("task_2_title", ""));
                    views.setTextViewText(R.id.widget_task_row_2_target, prefs.getString("task_2_target", "") + "h");
                    views.setOnClickPendingIntent(R.id.widget_task_row_2_play, getPlayTaskPendingIntent(context, 2));
                } else {
                    views.setViewVisibility(R.id.widget_task_row_2, View.GONE);
                }

                // Bind Task Row 3
                if (taskCount >= 3) {
                    views.setViewVisibility(R.id.widget_task_row_3, View.VISIBLE);
                    views.setTextViewText(R.id.widget_task_row_3_title, prefs.getString("task_3_title", ""));
                    views.setTextViewText(R.id.widget_task_row_3_target, prefs.getString("task_3_target", "") + "h");
                    views.setOnClickPendingIntent(R.id.widget_task_row_3_play, getPlayTaskPendingIntent(context, 3));
                } else {
                    views.setViewVisibility(R.id.widget_task_row_3, View.GONE);
                }
            }
        }

        // Apply changes to the Widget Manager
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static Bitmap drawProgressRing(Context context, int percentage) {
        try {
            int size = 150;
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            // Paints
            Paint paintBg = new Paint(Paint.ANTI_ALIAS_FLAG);
            paintBg.setStyle(Paint.Style.STROKE);
            paintBg.setStrokeWidth(12f);
            paintBg.setColor(Color.parseColor("#1E293B")); // Dark slate track

            Paint paintArc = new Paint(Paint.ANTI_ALIAS_FLAG);
            paintArc.setStyle(Paint.Style.STROKE);
            paintArc.setStrokeWidth(12f);
            paintArc.setStrokeCap(Paint.Cap.ROUND);

            // Neon cyan-to-violet linear/sweep gradient shader
            SweepGradient shader = new SweepGradient(size / 2f, size / 2f, 
                new int[]{Color.parseColor("#06B6D4"), Color.parseColor("#8B5CF6"), Color.parseColor("#06B6D4")}, 
                new float[]{0f, 0.5f, 1f});
            paintArc.setShader(shader);

            RectF rect = new RectF(10f, 10f, size - 10f, size - 10f);

            // Draw Background track
            canvas.drawCircle(size / 2f, size / 2f, (size - 20f) / 2f, paintBg);

            // Draw Progress arc
            if (percentage > 0) {
                float sweepAngle = (360f * percentage) / 100f;
                // Add soft neon outer glow using blur paint mask
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Paint paintGlow = new Paint(paintArc);
                    paintGlow.setStrokeWidth(20f);
                    paintGlow.setAlpha(80);
                    paintGlow.setMaskFilter(new BlurMaskFilter(6f, BlurMaskFilter.Blur.NORMAL));
                    canvas.drawArc(rect, -90f, sweepAngle, false, paintGlow);
                }
                canvas.drawArc(rect, -90f, sweepAngle, false, paintArc);
            }

            return bitmap;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private static PendingIntent getPendingSelfIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, DailyGoalWidget.class);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }

    private static PendingIntent getPlayTaskPendingIntent(Context context, int index) {
        Intent intent = new Intent(context, DailyGoalWidget.class);
        intent.setAction(ACTION_PLAY_TASK);
        intent.putExtra(EXTRA_TASK_INDEX, index);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, index, intent, flags);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String action = intent.getAction();

        if (ACTION_PLAY_TASK.equals(action)) {
            int index = intent.getIntExtra(EXTRA_TASK_INDEX, 1);
            String prefix = "task_" + index + "_";
            String taskId = prefs.getString(prefix + "id", null);
            String taskTitle = prefs.getString(prefix + "title", "");
            
            if (taskId != null) {
                editor.putString("active_task_id", taskId);
                editor.putString("active_task_title", taskTitle);
                editor.putString("active_task_elapsed", "0");
                editor.putString("active_task_start_time", String.valueOf(System.currentTimeMillis()));
                editor.putString("active_task_is_paused", "false");
                editor.putString("widget_sync_required", "true");
                editor.apply();
            }
        } 
        else if (ACTION_PLAY_PAUSE.equals(action)) {
            String activeTaskId = prefs.getString("active_task_id", null);
            if (activeTaskId != null && !activeTaskId.trim().isEmpty()) {
                boolean isPaused = true;
                long elapsed = 0;
                long startTime = 0;
                try {
                    Object isPausedObj = prefs.getAll().get("active_task_is_paused");
                    Object elapsedObj = prefs.getAll().get("active_task_elapsed");
                    Object startTimeObj = prefs.getAll().get("active_task_start_time");
                    isPaused = isPausedObj != null ? "true".equals(String.valueOf(isPausedObj)) : true;
                    elapsed = elapsedObj != null ? Long.parseLong(String.valueOf(elapsedObj)) : 0;
                    startTime = startTimeObj != null ? Long.parseLong(String.valueOf(startTimeObj)) : 0;
                } catch (Exception e) {}

                if (isPaused) {
                    // Resume
                    editor.putString("active_task_is_paused", "false");
                    editor.putString("active_task_start_time", String.valueOf(System.currentTimeMillis()));
                } else {
                    // Pause
                    long wallSeconds = (System.currentTimeMillis() - startTime) / 1000;
                    editor.putString("active_task_is_paused", "true");
                    editor.putString("active_task_elapsed", String.valueOf(elapsed + wallSeconds));
                }
                editor.putString("widget_sync_required", "true");
                editor.apply();
            }
        } 
        else if (ACTION_STOP.equals(action)) {
            editor.remove("active_task_id");
            editor.remove("active_task_title");
            editor.remove("active_task_elapsed");
            editor.remove("active_task_start_time");
            editor.remove("active_task_is_paused");
            editor.putString("widget_sync_required", "true");
            editor.apply();
        } 
        else if (ACTION_COMPLETE.equals(action)) {
            String activeTaskId = prefs.getString("active_task_id", null);
            if (activeTaskId != null && !activeTaskId.trim().isEmpty()) {
                // Complete task (locally flag it)
                editor.putString("complete_task_" + activeTaskId, "true");

                // Discard active timer state
                editor.remove("active_task_id");
                editor.remove("active_task_title");
                editor.remove("active_task_elapsed");
                editor.remove("active_task_start_time");
                editor.remove("active_task_is_paused");

                // Update completion percentage locally if we can calculate it
                int taskCount = 0;
                try {
                    Object taskCountObj = prefs.getAll().get("task_count");
                    taskCount = taskCountObj != null ? Integer.parseInt(String.valueOf(taskCountObj)) : 0;
                } catch (Exception e) {}

                if (taskCount > 0) {
                    int completed = 0;
                    for (int i = 1; i <= taskCount; i++) {
                        String id = prefs.getString("task_" + i + "_id", null);
                        Object isCompleteObj = prefs.getAll().get("complete_task_" + id);
                        boolean isComplete = isCompleteObj != null && "true".equals(String.valueOf(isCompleteObj));
                        if (id != null && (id.equals(activeTaskId) || isComplete)) {
                            completed++;
                        }
                    }
                    int percentage = (int) Math.round((completed * 100.0) / taskCount);
                    editor.putString("goal_completion_percentage", String.valueOf(percentage));
                }

                editor.putString("widget_sync_required", "true");
                editor.apply();
            }
        }

        // Force a widget redraw
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, DailyGoalWidget.class));
        onUpdate(context, mgr, ids);
    }

    private static String formatDuration(long totalSeconds) {
        long m = (totalSeconds % 3600) / 60;
        long s = totalSeconds % 60;
        return String.format("%02d:%02d", m, s);
    }
}
