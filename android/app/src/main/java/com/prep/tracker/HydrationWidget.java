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
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.widget.RemoteViews;
import androidx.core.content.ContextCompat;

public class HydrationWidget extends AppWidgetProvider {

    private static final String ACTION_ADD_WATER_250 = "com.prep.tracker.ACTION_ADD_WATER_250";
    private static final String ACTION_ADD_WATER_500 = "com.prep.tracker.ACTION_ADD_WATER_500";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hydration_widget);
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);

        // 1. Read water stats safely as String
        int completed = 0;
        int target = 2000;
        try {
            Object completedObj = prefs.getAll().get("water_completed_ml");
            Object targetObj = prefs.getAll().get("water_target_ml");
            completed = completedObj != null ? Integer.parseInt(String.valueOf(completedObj)) : 0;
            target = targetObj != null ? Integer.parseInt(String.valueOf(targetObj)) : 2000;
        } catch (Exception e) {
            completed = 0;
            target = 2000;
        }
        if (target <= 0) target = 2000;

        views.setTextViewText(R.id.widget_hydration_text, completed + " ml");
        views.setTextViewText(R.id.widget_hydration_goal, "Goal: " + target + " ml");

        // 2. Draw circular neon-blue status indicator
        Bitmap progressBmp = drawWaterProgress(context, completed, target);
        if (progressBmp != null) {
            views.setImageViewBitmap(R.id.widget_hydration_glass, progressBmp);
        }

        // 3. Setup quick add button PendingIntents
        views.setOnClickPendingIntent(R.id.widget_btn_water_250, getPendingSelfIntent(context, ACTION_ADD_WATER_250, 201));
        views.setOnClickPendingIntent(R.id.widget_btn_water_500, getPendingSelfIntent(context, ACTION_ADD_WATER_500, 202));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static Bitmap drawWaterProgress(Context context, int completed, int target) {
        try {
            int size = 120;
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            // Paints
            Paint paintBg = new Paint(Paint.ANTI_ALIAS_FLAG);
            paintBg.setStyle(Paint.Style.STROKE);
            paintBg.setStrokeWidth(8f);
            paintBg.setColor(Color.parseColor("#1E293B")); // Dark slate track

            Paint paintArc = new Paint(Paint.ANTI_ALIAS_FLAG);
            paintArc.setStyle(Paint.Style.STROKE);
            paintArc.setStrokeWidth(8f);
            paintArc.setStrokeCap(Paint.Cap.ROUND);

            // Sci-fi neon-blue progress gradient
            SweepGradient shader = new SweepGradient(size / 2f, size / 2f,
                new int[]{Color.parseColor("#38BDF8"), Color.parseColor("#06B6D4"), Color.parseColor("#38BDF8")},
                new float[]{0f, 0.5f, 1f});
            paintArc.setShader(shader);

            RectF rect = new RectF(8f, 8f, size - 8f, size - 8f);

            // Draw track
            canvas.drawCircle(size / 2f, size / 2f, (size - 16f) / 2f, paintBg);

            // Draw progress arc
            float percentage = Math.min(1.0f, (float) completed / target);
            if (percentage > 0) {
                float sweepAngle = 360f * percentage;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Paint paintGlow = new Paint(paintArc);
                    paintGlow.setStrokeWidth(14f);
                    paintGlow.setAlpha(60);
                    paintGlow.setMaskFilter(new BlurMaskFilter(4f, BlurMaskFilter.Blur.NORMAL));
                    canvas.drawArc(rect, -90f, sweepAngle, false, paintGlow);
                }
                canvas.drawArc(rect, -90f, sweepAngle, false, paintArc);
            }

            // Draw static Droplet Vector icon in the center
            Drawable droplet = ContextCompat.getDrawable(context, R.drawable.ic_widget_water);
            if (droplet != null) {
                int iconSize = 48;
                int left = (size - iconSize) / 2;
                int top = (size - iconSize) / 2;
                droplet.setBounds(left, top, left + iconSize, top + iconSize);
                droplet.draw(canvas);
            }

            return bitmap;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private PendingIntent getPendingSelfIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, HydrationWidget.class);
        intent.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String action = intent.getAction();
        int completed = 0;
        try {
            Object completedObj = prefs.getAll().get("water_completed_ml");
            completed = completedObj != null ? Integer.parseInt(String.valueOf(completedObj)) : 0;
        } catch (Exception e) {}

        if (ACTION_ADD_WATER_250.equals(action)) {
            editor.putString("water_completed_ml", String.valueOf(completed + 250));
            editor.putString("widget_sync_required", "true");
            editor.apply();
        } 
        else if (ACTION_ADD_WATER_500.equals(action)) {
            editor.putString("water_completed_ml", String.valueOf(completed + 500));
            editor.putString("widget_sync_required", "true");
            editor.apply();
        }

        // Force redrawing
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, HydrationWidget.class));
        onUpdate(context, mgr, ids);
    }
}
