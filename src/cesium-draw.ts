import * as Cesium from 'cesium';
import type {
  Viewer,
  ScreenSpaceEventHandler,
  Cartesian2,
  Cartesian3,
  CustomDataSource,
  Property,
  Entity,
} from 'cesium';
import {
  createTipEntity,
  createPointEntity,
  createLineEntity,
  createPolygonEntity,
  createRectangleEntity,
} from './create-entity';

interface Position {
  lon: number;
  lat: number;
  alt: number;
}
interface MeasureOptions {
  callback?: (positions: Position[]) => void;
  showDelete?: boolean;
}
export class CesiumDraw {
  readonly measureEndTip = '右键结束测量，esc取消绘制';

  readonly measureStartTip = '左键选择起点，esc取消绘制';

  viewer: Viewer;

  drawLayer: CustomDataSource;

  handler: ScreenSpaceEventHandler | null = null;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.drawLayer = new Cesium.CustomDataSource('measureLayer');
    this.viewer.dataSources.add(this.drawLayer);
  }

  /**
   * 坐标转换 84转笛卡尔
   * @param {Position} position 位置
   * @param {number} alt 高度
   * @returns {Cartesian3} 笛卡尔坐标
   */
  static transformWGS84ToCartesian = (position: Position, alt = 0) => {
    return Cesium.Cartesian3.fromDegrees(position.lon, position.lat, alt || position.alt, Cesium.Ellipsoid.WGS84);
  };

  /**
   * 笛卡尔数组转84数组
   * @param {Array} cartesianArr 三维位置坐标数组
   * @return {Array} {lon,lat,alt} 地理坐标数组
   */
  static transformCartesianArrayToWGS84Array(cartesianArr: Cartesian3[]) {
    return cartesianArr.map((item) => {
      const ellipsoid = Cesium.Ellipsoid.WGS84;
      const cartographic = ellipsoid.cartesianToCartographic(item);
      return {
        lon: Cesium.Math.toDegrees(cartographic.longitude),
        lat: Cesium.Math.toDegrees(cartographic.latitude),
        alt: cartographic.height,
      };
    });
  }

  /**
   * 84坐标转弧度坐标
   * @param {Object} position wgs84
   * @return {Object} Cartographic 弧度坐标
   */
  static transformWGS84ToCartographic = (position: Position) => {
    return Cesium.Cartographic.fromDegrees(position.lon, position.lat, position.alt);
  };

  /**
   * 二维坐标转三维坐标
   * @param {Object} px 屏幕坐标
   * @return {Object} Cartesian3 三维坐标
   */
  getCatesian3FromPX(cartesian2: Cartesian2) {
    // const ray = this.viewer.camera.getPickRay(cartesian2);
    // if (!ray) {
    //   return;
    // }
    // const pickCartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    const pickEllipsoidCartesian = this.viewer.scene.camera.pickEllipsoid(
      cartesian2,
      this.viewer.scene.globe.ellipsoid
    );
    return pickEllipsoidCartesian;
  }

  /**
   * 获取84坐标的距离
   * @param {*} positions 坐标集合
   * @return {number} 距离
   */
  static getPositionDistance(positions: Cartesian3[]) {
    const wgs84Array = CesiumDraw.transformCartesianArrayToWGS84Array(positions);
    let distance = 0;
    for (let i = 0; i < wgs84Array.length - 1; i += 1) {
      const point1cartographic = CesiumDraw.transformWGS84ToCartographic(wgs84Array[i]);
      const point2cartographic = CesiumDraw.transformWGS84ToCartographic(wgs84Array[i + 1]);
      const geodesic = new Cesium.EllipsoidGeodesic();

      geodesic.setEndPoints(point1cartographic, point2cartographic);
      let s = geodesic.surfaceDistance;

      s = Math.sqrt(s ** 2 + (point2cartographic.height - point1cartographic.height) ** 2);
      distance += s;
    }
    return {
      distance,
      wgs84Array,
    };
  }

  /**
   * 计算一组坐标组成多边形的面积
   * @param {*} positions 坐标集合
   */
  static getPositionsArea(positions: Cartesian3[]) {
    const wgs84Array = CesiumDraw.transformCartesianArrayToWGS84Array(positions);
    let area = 0;
    let h = 0;
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    wgs84Array.push(wgs84Array[0]);
    for (let i = 1; i < positions.length; i += 1) {
      const oel = ellipsoid.cartographicToCartesian(CesiumDraw.transformWGS84ToCartographic(wgs84Array[i - 1]));
      const el = ellipsoid.cartographicToCartesian(CesiumDraw.transformWGS84ToCartographic(wgs84Array[i]));
      h += oel.x * el.y - el.x * oel.y;
    }
    area = Number(Math.abs(h).toFixed(2));

    return {
      area,
      wgs84Array,
    };
  }

  /**
   * 测距
   * @param {*} options 配置
   * @return {string} 距离
   */
  drawLineMeasureGraphics(options?: MeasureOptions) {
    this.clear();
    const positions: Cartesian3[] = [];
    const tipEntity = createTipEntity(this.drawLayer, this.measureStartTip);
    createLineEntity(positions, this.drawLayer);
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    // 监听esc
    document.addEventListener('keydown', this.escCancel);
    // 鼠标左键点击
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.position);
      if (!cartesian) {
        return;
      }
      if (positions.length === 0) {
        tipEntity.label!.text = this.measureEndTip as unknown as Property;
        positions.push(cartesian.clone());
      }
      positions.push(cartesian);
      // 在三维场景中添加 Label
      const { distance } = CesiumDraw.getPositionDistance(positions);
      createPointEntity(cartesian, this.drawLayer, `${(distance / 1e3).toFixed(2)}km`);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 鼠标移动
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.endPosition);
      if (!cartesian) {
        tipEntity.label!.show = false as unknown as Property;
        return;
      }
      tipEntity.label!.show = true as unknown as Property;
      Object.assign(tipEntity, {
        position: cartesian,
      });
      if (positions.length >= 2) {
        positions.pop();
        positions.push(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 右键结束
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.position);
      if (!cartesian) {
        return;
      }
      document.removeEventListener('keydown', this.escCancel);
      this.destroy();
      this.drawLayer.entities.remove(tipEntity);
      const { distance, wgs84Array } = CesiumDraw.getPositionDistance(positions);
      const distanceText = `${(distance / 1e3).toFixed(2)}km`;
      createPointEntity(cartesian, this.drawLayer, distanceText);
      const deleteTipEntity = createTipEntity(
        this.drawLayer,
        `删除`,
        cartesian,
        new Cesium.Cartesian2(distanceText.length * 8 + 20, -19)
      );
      this.deleteEntity(deleteTipEntity);
      if (options?.callback && typeof options.callback === 'function') {
        options.callback(wgs84Array);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 测面积
   * @param {*} options 配置
   */
  drawAreaMeasureGraphics(options?: MeasureOptions) {
    this.clear();
    const positions: Cartesian3[] = [];
    const { polygon } = createPolygonEntity(positions, this.drawLayer);
    const tipEntity = createTipEntity(this.drawLayer, this.measureStartTip);
    document.addEventListener('keydown', this.escCancel);
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    // 鼠标左键点击
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.position);
      if (!cartesian) {
        return;
      }
      if (positions.length === 0) {
        polygon.positions.push(cartesian.clone());
        positions.push(cartesian.clone());
      }
      positions.push(cartesian.clone());
      polygon.positions.push(cartesian.clone());
      createPointEntity(cartesian, this.drawLayer);
      let text = '';
      if (positions.length <= 2) {
        text = '点击选择下一个点，esc取消绘制';
      } else {
        text = `点击选择下一个点，${this.measureEndTip}`;
      }
      tipEntity.label!.text = text as unknown as Property;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 鼠标移动
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.endPosition);
      if (!cartesian) {
        tipEntity.label!.show = false as unknown as Property;
        return;
      }
      tipEntity.label!.show = true as unknown as Property;
      Object.assign(tipEntity, {
        position: cartesian,
      });
      if (positions.length >= 2) {
        positions.pop();
        positions.push(cartesian);
        polygon.positions.pop();
        polygon.positions.push(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 右键结束
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.getCatesian3FromPX(movement.position);
      if (!cartesian) {
        return;
      }
      document.removeEventListener('keydown', this.escCancel);
      this.destroy();
      this.drawLayer.entities.remove(tipEntity);
      positions.push(positions[0]);
      const { area, wgs84Array } = CesiumDraw.getPositionsArea(positions);
      const areaText = `${(area / 1e6).toFixed(2)}km²`;
      // 添加信息点
      createPointEntity(cartesian, this.drawLayer, areaText);
      if (options?.showDelete) {
        const deleteTipEntity = createTipEntity(
          this.drawLayer,
          `删除`,
          cartesian,
          new Cesium.Cartesian2(areaText.length * 8 + 20, -19)
        );
        this.deleteEntity(deleteTipEntity);
      }
      if (options && typeof options.callback === 'function') {
        options.callback(wgs84Array);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 画矩形
   */
  drawRectangleMeasureGraphics(options?: MeasureOptions) {
    this.clear();
    let positions: Cartesian3[] = [];
    let rectangle: Entity | null = null;
    const { canvas } = this.viewer.scene;
    const tipEntity = createTipEntity(this.drawLayer, this.measureStartTip);
    document.addEventListener('keydown', this.escCancel);
    this.handler = new Cesium.ScreenSpaceEventHandler(canvas);
    // 鼠标左键点击
    this.handler.setInputAction((click: ScreenSpaceEventHandler.PositionedEvent) => {
      if (positions.length) return;
      const cartesian = this.getCatesian3FromPX(click.position);
      if (!cartesian) return;
      positions.push(cartesian, cartesian);
      tipEntity.label!.text = '鼠标移动选区域，右键结束绘制，esc取消' as unknown as Property;
      createPointEntity(cartesian, this.drawLayer);
      rectangle = createRectangleEntity(
        new Cesium.CallbackProperty(() => {
          const obj = Cesium.Rectangle.fromCartesianArray(positions);
          return obj;
        }, false),
        this.drawLayer
      );
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 鼠标移动
    this.handler!.setInputAction((move: ScreenSpaceEventHandler.MotionEvent) => {
      const cartesian = this.getCatesian3FromPX(move.endPosition);
      if (!cartesian) return;
      Object.assign(tipEntity, {
        position: cartesian,
      });
      if (!rectangle) return;
      positions = [...positions.slice(0, -1), cartesian];
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 右键结束
    this.handler.setInputAction(() => {
      this.drawLayer.entities.remove(tipEntity);
      createPointEntity(positions[1], this.drawLayer);
      document.removeEventListener('keydown', this.escCancel);
      this.destroy();
      const { wgs84Array } = CesiumDraw.getPositionsArea(positions);
      if (options && typeof options.callback === 'function') {
        options.callback(wgs84Array);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
   * 删除实体
   */
  deleteEntity(entity: Entity) {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id.id === entity.id) {
        this.clear();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * 清除所有绘制
   */
  clear() {
    this.drawLayer.entities.removeAll();
    this.destroy();
  }

  destroy() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }

  escCancel = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.clear();
      document.removeEventListener('keydown', this.escCancel);
    }
  };
}
