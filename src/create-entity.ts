import * as Cesium from 'cesium';
import type { Cartesian3, CustomDataSource, CallbackProperty } from 'cesium';
// 创建Tip实体
export const createTipEntity = (
  layer: CustomDataSource,
  text: string,
  position?: Cartesian3,
  pixelOffset = new Cesium.Cartesian2(20, -10)
) => {
  const tipEntity = new Cesium.Entity({
    position,
    label: {
      text,
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(8, 8),
      font: '14px sans-serif',
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset,
      eyeOffset: new Cesium.Cartesian3(0, 0, -5), // 为了确保标签之间不重叠，可以设置eyeOffset
    },
  });
  return layer.entities.add(tipEntity);
};
// 创建点实体
export const createPointEntity = (position: Cartesian3, layer: CustomDataSource, text = '') => {
  const labelEntity = new Cesium.Entity({
    name: '空间直线距离',
    position,
    point: {
      pixelSize: 5,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 3,
    },
    label: {
      text,
      font: '14px sans-serif',
      showBackground: true,
      fillColor: Cesium.Color.WHITE,
      backgroundPadding: new Cesium.Cartesian2(8, 8),
      backgroundColor: Cesium.Color.RED,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(20, -20),
    },
  });
  return layer.entities.add(labelEntity);
};
export const createLineEntity = (positions: Cartesian3[], layer: CustomDataSource) => {
  const lineEntity = new Cesium.Entity({
    polyline: {
      width: 2,
      material: Cesium.Color.RED.withAlpha(0.8),
      positions: new Cesium.CallbackProperty(() => positions, false),
      clampToGround: true,
    },
  });
  layer.entities.add(lineEntity);
  return lineEntity;
};
export const createPolygonEntity = (positions: Cartesian3[], layer: CustomDataSource) => {
  const polygon = new Cesium.PolygonHierarchy();
  const polygonEntity = new Cesium.Entity({
    polyline: {
      width: 2,
      material: Cesium.Color.RED.withAlpha(0.8),
      clampToGround: true,
      positions: new Cesium.CallbackProperty(() => positions, false),
    },
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => polygon, false),
      material: Cesium.Color.RED.withAlpha(0.2),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
  layer.entities.add(polygonEntity);
  return {
    polygon,
    polygonEntity,
  };
};
export const createRectangleEntity = (coordinates: CallbackProperty, layer: CustomDataSource) => {
  const rectangleEntity = layer.entities.add({
    name: 'rectangle',
    rectangle: {
      coordinates,
      material: Cesium.Color.RED.withAlpha(0.2),
      outlineColor: Cesium.Color.RED.withAlpha(0.8),
      outlineWidth: 2, // 设置边框宽度
      outline: true, // 是否显示边框
      height: 0,
    },
  });
  return rectangleEntity;
};
// 计算两点间距离
export const getLengthText = (firstPoint: Cartesian3, secondPoint: Cartesian3) => {
  const distance = Cesium.Cartesian3.distance(firstPoint, secondPoint);
  let text = '';
  if (distance > 1000) {
    text = `${(distance / 1000).toFixed(2)} 千米`;
  } else {
    text = `${distance.toFixed(2)} 米`;
  }
  return text;
};
