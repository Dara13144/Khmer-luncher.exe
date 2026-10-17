package com.example.hud;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class CpsTracker {
    private static final List<Long> leftClicks = new ArrayList<>();
    private static final List<Long> rightClicks = new ArrayList<>();

    public static synchronized void registerLeftClick() {
        leftClicks.add(System.currentTimeMillis());
    }

    public static synchronized void registerRightClick() {
        rightClicks.add(System.currentTimeMillis());
    }

    public static synchronized int getLeftCps() {
        long now = System.currentTimeMillis();
        Iterator<Long> it = leftClicks.iterator();
        while (it.hasNext()) {
            if (now - it.next() > 1000) {
                it.remove();
            }
        }
        return leftClicks.size();
    }

    public static synchronized int getRightCps() {
        long now = System.currentTimeMillis();
        Iterator<Long> it = rightClicks.iterator();
        while (it.hasNext()) {
            if (now - it.next() > 1000) {
                it.remove();
            }
        }
        return rightClicks.size();
    }
}
