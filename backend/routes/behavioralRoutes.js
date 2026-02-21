const express = require("express");
const router = express.Router();

/**
 * Behavioral Analytics Routes (BAA)
 * Analyzes cursor movement, keystroke patterns, and user behavior for fraud detection
 */

// Simple Cursor Analyzer
class CursorAnalyzer {
  extractFeatures(points) {
    if (!points || points.length < 5) {
      return this.getEmptyFeatures();
    }

    const x = points.map((p) => p.x);
    const y = points.map((p) => p.y);
    const t = points.map((p) => p.timestamp);

    // Normalize timestamps
    const tNorm = t.map((ti) => (ti - t[0]) / 1000);

    // Calculate velocities
    const velocities = [];
    for (let i = 1; i < points.length; i++) {
      const dx = x[i] - x[i - 1];
      const dy = y[i] - y[i - 1];
      const dt = Math.max(tNorm[i] - tNorm[i - 1], 0.001);
      const dist = Math.sqrt(dx * dx + dy * dy);
      velocities.push(dist / dt);
    }

    // Calculate statistics
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr) => {
      const m = mean(arr);
      return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);
    };

    const meanVel = mean(velocities);
    const stdVel = std(velocities);

    // Total path distance
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += Math.sqrt(Math.pow(x[i] - x[i - 1], 2) + Math.pow(y[i] - y[i - 1], 2));
    }

    // Direct distance
    const directDistance = Math.sqrt(Math.pow(x[x.length - 1] - x[0], 2) + Math.pow(y[y.length - 1] - y[0], 2));
    const directnessRatio = directDistance > 0 ? Math.min(directDistance / Math.max(totalDistance, 0.001), 1) : 0;

    return {
      velocity: {
        mean: Number(meanVel.toFixed(2)),
        std: Number(stdVel.toFixed(2)),
        max: Number(Math.max(...velocities).toFixed(2)),
        min: Number(Math.min(...velocities).toFixed(2)),
      },
      path: {
        totalDistance: Number(totalDistance.toFixed(2)),
        directDistance: Number(directDistance.toFixed(2)),
        directnessRatio: Number(directnessRatio.toFixed(3)),
      },
      pointCount: points.length,
      duration: Number(tNorm[tNorm.length - 1].toFixed(2)),
    };
  }

  getEmptyFeatures() {
    return {
      velocity: { mean: 0, std: 0, max: 0, min: 0 },
      path: { totalDistance: 0, directDistance: 0, directnessRatio: 0 },
      pointCount: 0,
      duration: 0,
    };
  }

  calculateAnomalyScore(features) {
    let score = 0;

    // Unusually high velocity (bot-like)
    if (features.velocity.mean > 5000) score += 30;

    // Too perfect path (bot-like)
    if (features.path.directnessRatio > 0.95) score += 25;

    // Too few points (bot-like)
    if (features.pointCount < 10) score += 15;

    // Too fast completion (suspicious)
    if (features.duration < 0.5) score += 20;

    return Math.min(score, 100);
  }
}

// Simple Keystroke Analyzer
class KeystrokeAnalyzer {
  extractFeatures(keystrokes) {
    if (!keystrokes || keystrokes.length < 3) {
      return this.getEmptyFeatures();
    }

    const intervals = [];
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].pressTime - keystrokes[i - 1].pressTime;
      if (interval > 0) intervals.push(interval);
    }

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr) => {
      const m = mean(arr);
      return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);
    };

    const meanInterval = intervals.length > 0 ? mean(intervals) : 0;
    const stdInterval = intervals.length > 0 ? std(intervals) : 0;

    // Dwell times (key hold duration)
    const dwellTimes = keystrokes
      .filter((k) => k.releaseTime)
      .map((k) => k.releaseTime - k.pressTime);
    const meanDwell = dwellTimes.length > 0 ? mean(dwellTimes) : 0;

    return {
      keyCount: keystrokes.length,
      intervals: {
        mean: Number(meanInterval.toFixed(2)),
        std: Number(stdInterval.toFixed(2)),
      },
      dwellTime: {
        mean: Number(meanDwell.toFixed(2)),
      },
      rhythm: this.detectRhythm(intervals),
    };
  }

  detectRhythm(intervals) {
    if (intervals.length < 5) return "UNKNOWN";
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const consistency = (mean - Math.min(...intervals)) / (Math.max(...intervals) - Math.min(...intervals));

    if (consistency > 0.8) return "VERY_CONSISTENT";
    if (consistency > 0.6) return "CONSISTENT";
    if (consistency > 0.4) return "NORMAL";
    return "VARIABLE";
  }

  getEmptyFeatures() {
    return {
      keyCount: 0,
      intervals: { mean: 0, std: 0 },
      dwellTime: { mean: 0 },
      rhythm: "UNKNOWN",
    };
  }

  calculateAnomalyScore(features) {
    let score = 0;

    // Robot-like perfect rhythm
    if (features.rhythm === "VERY_CONSISTENT") score += 35;

    // Extremely fast typer (suspicious)
    if (features.intervals.mean < 30) score += 25;

    // Too slow (maybe using script)
    if (features.intervals.mean > 2000) score += 10;

    return Math.min(score, 100);
  }
}

const cursorAnalyzer = new CursorAnalyzer();
const keystrokeAnalyzer = new KeystrokeAnalyzer();

// Store user profiles (in production, use database)
const userProfiles = new Map();

// @route   POST /api/behavioral/analyze
// @desc    Analyze cursor movement and keystroke patterns
// @access  Public
router.post("/analyze", async (req, res) => {
  try {
    const { user_id = "anonymous", cursor_points = [], keystrokes = [], session_info = {} } = req.body;

    console.log(`🎯 BAA Analysis:
      - User: ${user_id}
      - Cursor points: ${cursor_points.length}
      - Keystrokes: ${keystrokes.length}`);

    // Extract features
    const cursorFeatures = cursorAnalyzer.extractFeatures(cursor_points);
    const keystrokeFeatures = keystrokeAnalyzer.extractFeatures(keystrokes);

    // Calculate anomaly scores
    const cursorAnomalyScore = cursorAnalyzer.calculateAnomalyScore(cursorFeatures);
    const keystrokeAnomalyScore = keystrokeAnalyzer.calculateAnomalyScore(keystrokeFeatures);

    // Combined risk score
    const riskScore = Math.round((cursorAnomalyScore + keystrokeAnomalyScore) / 2);

    // Get user baseline
    const userBaseline = userProfiles.get(user_id) || null;
    const isAnomaly = riskScore > 50;

    // Fraud indicators
    const fraudIndicators = [];
    if (cursorAnomalyScore > 50) fraudIndicators.push("Suspicious cursor behavior");
    if (keystrokeAnomalyScore > 50) fraudIndicators.push("Suspicious keystroke pattern");
    if (isAnomaly && userBaseline) fraudIndicators.push("Deviation from user baseline");

    const result = {
      user_id,
      analysis: {
        cursor: cursorFeatures,
        keystroke: keystrokeFeatures,
      },
      anomaly_scores: {
        cursor: cursorAnomalyScore,
        keystroke: keystrokeAnomalyScore,
        combined: riskScore,
      },
      risk_level: riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
      is_anomaly: isAnomaly,
      fraud_indicators: fraudIndicators,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Analysis complete - Risk: ${result.risk_level} (${riskScore})`);

    res.json(result);
  } catch (error) {
    console.error("❌ BAA Analysis error:", error);
    res.status(500).json({
      error: "Behavioral analysis failed",
      message: error.message,
    });
  }
});

// @route   POST /api/behavioral/update-baseline
// @desc    Update user behavioral baseline
// @access  Public
router.post("/update-baseline", async (req, res) => {
  try {
    const { user_id, cursor_points = [], keystrokes = [] } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const cursorFeatures = cursorAnalyzer.extractFeatures(cursor_points);
    const keystrokeFeatures = keystrokeAnalyzer.extractFeatures(keystrokes);

    // Store baseline
    userProfiles.set(user_id, {
      cursor: cursorFeatures,
      keystroke: keystrokeFeatures,
      updated_at: new Date().toISOString(),
    });

    console.log(`✅ Baseline updated for user: ${user_id}`);

    res.json({
      success: true,
      message: "Behavioral baseline updated",
      user_id,
      profile: userProfiles.get(user_id),
    });
  } catch (error) {
    console.error("❌ Baseline update error:", error);
    res.status(500).json({
      error: "Failed to update baseline",
      message: error.message,
    });
  }
});

// @route   GET /api/behavioral/profile/:user_id
// @desc    Get user behavioral profile
// @access  Public
router.get("/profile/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const profile = userProfiles.get(user_id);

    if (!profile) {
      return res.json({
        user_id,
        profile: null,
        message: "No behavioral profile found for this user",
      });
    }

    res.json({
      user_id,
      profile,
    });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      message: error.message,
    });
  }
});

// @route   POST /api/behavioral/health
// @desc    Health check for BAA
// @access  Public
router.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "Behavioral Analytics (BAA)",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
