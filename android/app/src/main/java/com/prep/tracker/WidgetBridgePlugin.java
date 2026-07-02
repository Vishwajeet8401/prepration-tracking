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
        Object obj = prefs.getAll().get(key);
        String value = obj != null ? String.valueOf(obj) : "";

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    @PluginMethod
    public void reloadAllTimelines(PluginCall call) {
        Context context = getContext();
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        
        // 1. Force synchronous update for Daily Goal Widget
        int[] idsDaily = mgr.getAppWidgetIds(new ComponentName(context, DailyGoalWidget.class));
        for (int id : idsDaily) {
            DailyGoalWidget.updateAppWidget(context, mgr, id);
        }

        // 2. Force synchronous update for Hydration Widget
        int[] idsHydration = mgr.getAppWidgetIds(new ComponentName(context, HydrationWidget.class));
        for (int id : idsHydration) {
            HydrationWidget.updateAppWidget(context, mgr, id);
        }

        call.resolve();
    }
}
