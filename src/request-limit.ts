// 并发请求控制
type Tasks<T> = (() => Promise<T>)[];
export function requestLimit<T>(tasks: Tasks<T>, pool: number): Promise<T[]> {
  // 每次控制的发送请求的数量pool
  const fetchPool = pool || 6;
  // 用于存储每一次请求的结果(按顺序进行存贮)
  const results: T[] = [];
  // index为每次获取的任务值
  let index = 0;
  // together 用于创建工作区，当pool传入的是几，我们就对应的创建几个工作区
  // 也就是创建一个长度为pool且值为null的一个数组
  const together = new Array(fetchPool).fill(null).map(() => {
    // 基于Promise进行管理
    return new Promise((resolve, reject) => {
      // 创建一个函数，进来立刻执行
      const run = () => {
        // 如果任务池已经空了，说明请求发送完成了，直接成功
        if (index >= tasks.length) {
          resolve(results);
          return;
        }
        // 先将index保存一下用于存储当前成功请求的结果
        const oldIndex = index;
        // 获取当前发送的请求，然后把index进行累加，所以上面会把index保存起来
        // 这里index++ 是先运算后累加的，而++index则相反，先累加后运算
        const task = tasks[index];
        index += 1;
        // 执行请求
        task()
          .then((result) => {
            // 将成功结果保存
            results[oldIndex] = result;
            // 递归继续执行，也就是继续拿到任务到工作区执行
            run();
          })
          .catch((reason) => {
            reject(reason);
          });
      };
      // 立即执行
      run();
    });
  });
  // 用Promise.all管控工作区，也就是每次并发两个请求
  return Promise.all(together).then(() => results);
}
