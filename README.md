## 前端常用函数库

### cesium 测距、测面积功能

```javascript
import { CesiumDraw } from 'htht-frontend-util';

const cesiumDraw = new CesiumDraw(viewer);
cesiumDraw.drawLineMeasureGraphics(); // 绘制线测距
cesiumDraw.drawAreaMeasureGraphics(); // 绘制面积测量
cesCesiumDraw.drawRectangleMeasureGraphics(); // 画长方形
```
