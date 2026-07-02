package com.prep.tracker;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.appwidget.AppWidgetManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void setItem(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || value == null) {
            call.reject("Key or Value cannot be null");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(key, value);
        editor.apply();

        call.resolve();
    }

    @PluginMethod
    public void getItem(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Key cannot be null");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE);
        String value = prefs.getString(key, "");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    @PluginMethod
    public void reloadAllTimelines(PluginCall call) {
        Context context = getContext();
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        
        // 1. Force update for Daily Goal Widget
        Intent updateDaily = new Intent(context, DailyGoalWidget.class);
        updateDaily.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] idsDaily = mgr.getAppWidgetIds(new ComponentName(context, DailyGoalWidget.class));
        updateDaily.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, idsDaily);
        context.sendBroadcast(updateDaily);

        // 2. Force update for Hydration Widget
        Intent updateHydration = new Intent(context, HydrationWidget.class);
        updateHydration.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] idsHydration = mgr.getAppWidgetIds(new ComponentName(context, HydrationWidget.class));
        updateHydration.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, idsHydration);
        context.sendBroadcast(updateHydration);

        call.resolve();
    }
}
