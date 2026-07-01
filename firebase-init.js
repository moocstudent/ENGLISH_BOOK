/* Initialize Firebase (plain config — no encryption). */
(function () {
  window.__FIREBASE_READY__ = (async function () {
    if (typeof firebase === "undefined") {
      console.error("[firebase-init] Firebase SDK not loaded.");
      return false;
    }
    const cfg = window.__FIREBASE_CONFIG__;
    if (!cfg) {
      console.error("[firebase-init] Missing firebase-config.js");
      return false;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      console.log("[firebase-init] Ready:", cfg.projectId);
      return true;
    } catch (e) {
      console.error("[firebase-init] Init failed:", e);
      return false;
    }
  })();
})();
