---
"@homeslate/display": patch
---

Keep the kiosk layout still when the light/dark tooltip opens. The theme tooltip is portaled into the display, and that display was stretching every child, so the canvas gave up height and widget bottoms jumped up.
